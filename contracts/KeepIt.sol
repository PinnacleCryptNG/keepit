// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title KeepIt
 * @notice Daily habit escrow: deposit all days' USDC up front and check in on each UTC day.
 * Every checked day secures that day's stake for refund. Every missed day loses that stake
 * to a shared pool. Only goals that finish every day perfectly receive pool rewards, weighted
 * by their total original stake while they remain unsettled. Pool shares are stream-based:
 * a keeper earns a share of each missed stake processed while their goal is still unsettled.
 * A first miss removes all pool weight and redistributes accrued rewards. Anyone can process
 * misses; non-owners can only force-settle a week after the goal ended. Claimers can pass
 * sweepIds so every known elapsed miss is counted before their reward locks. Funds distributed
 * when no weight is active carry to the next goals created.
 * The owner claims the secured principal and locked pool reward together in one transfer.
 * Friend challenges copy the terms but have independent start days, check-ins and payouts.
 * @dev Intended token: Arc Testnet USDC, 0x3600000000000000000000000000000000000000,
 * with six decimals. The constructor accepts the token explicitly; it does not verify its identity.
 * Day zero is the creation UTC day, even if creation is just before midnight. Notes/photo URLs
 * are public event data, not validated evidence. No administrator, pause, rescue or upgrade exists.
 *
 * Accounting invariant for the intended non-rebasing, exact-transfer USDC:
 * token balance >= unclaimed goal principals + poolBalance. Unclaimed principals mean each
 * goal's deposit minus processed missed stakes (and minus its refund once claimed). Unprocessed
 * missed days remain principal liabilities until processing. Donations are not pool deposits.
 * Locked, unpaid rewards are reserved: their sum never exceeds poolBalance. Paying a reward
 * decreases both its reservation and poolBalance. Forfeiture redistributes existing rewards;
 * it never increases poolBalance. Cumulative rewards paid cannot exceed cumulative missed stakes.
 *
 * Rounding is conservative: accumulator fractions consumed are rounded UP when computing
 * whole-token carry, so a fraction is never both credited and carried. Whole-token rewardDebt
 * rounding can still create overlapping one-unit entitlements across membership changes.
 * Settlement therefore caps rewards to poolBalance minus already locked rewards. Preview uses
 * the same cap. This only reduces payouts; dust may remain locked, but cannot spend principal
 * or another settled goal's reward. Processing/settlement order affects pool participation;
 * this is an accumulator pool, not a retrospective split among all eventual perfect finishers.
 * No call automatically scans other goals for unprocessed misses.
 */
contract KeepIt is ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant MIN_STAKE_PER_DAY = 10_000;
    uint256 public constant MAX_STAKE_PER_DAY = 100_000_000;
    uint256 public constant SETTLE_GRACE = 7 days;
    uint256 private constant SCALE = 1e18;

    /// @notice The immutable escrow token, denominated in its smallest units.
    IERC20 public immutable usdc;

    struct Goal {
        address owner;
        uint32 startDay;
        uint8 duration;
        uint256 stakePerDay;
        uint32 checkedMask;
        uint8 processed;
        uint8 missedDays;
        uint256 parentId;
        uint256 rewardDebt;
        uint256 reward;
        bool broken;
        bool settled;
        bool claimed;
    }

    struct Metadata {
        string name;
        string emoji;
    }

    /// @notice Frontend projection; elapsedDays excludes today's still-open day.
    struct GoalView {
        uint256 id;
        address owner;
        string name;
        string emoji;
        uint256 stakePerDay;
        uint8 duration;
        uint32 startDay;
        uint32 checkedMask;
        uint8 processed;
        uint8 missedDays;
        uint256 parentId;
        bool broken;
        bool settled;
        bool claimed;
        uint8 keptDays;
        uint8 elapsedDays;
        uint8 currentStreak;
        bool checkedToday;
        bool ended;
        bool perfectSoFar;
    }

    mapping(uint256 => Goal) private _goals;
    mapping(uint256 => Metadata) private _metadata;
    mapping(address => uint256[]) private _ownerGoals;
    /// @notice Check-in Unix timestamps, indexed by goal and zero-based goal day.
    mapping(uint256 => mapping(uint8 => uint40)) public checkInTimestamps;
    /// @notice Direct joins of a parent; joining a child increments that child's count.
    mapping(uint256 => uint256) public challengeJoinCount;

    uint256 private _goalCount;
    uint256 private _totalStaked;
    uint256 private _totalKept;
    uint256 private _totalPaidOut;
    uint256 private _reservedRewards;
    uint256 public totalActiveWeight;
    uint256 public accRewardPerWeight;
    uint256 public undistributed;
    uint256 public poolBalance;

    error ZeroTokenAddress();
    error UnknownGoal(uint256 id);
    error NotGoalOwner(uint256 id);
    error InvalidDuration(uint8 duration);
    error InvalidStake(uint256 stakePerDay);
    error InvalidNameLength();
    error InvalidEmojiLength();
    error NoteTooLong();
    error GoalEnded(uint256 id);
    error GoalNotEnded(uint256 id);
    error GraceNotElapsed(uint256 id);
    error TooManySweeps();
    error AlreadyCheckedIn(uint256 id, uint8 dayIndex);
    error AlreadyClaimed(uint256 id);
    error InexactDeposit();

    event GoalCreated(
        uint256 indexed id, address indexed owner, uint256 parentId,
        string name, string emoji, uint8 duration, uint256 stakePerDay, uint32 startDay
    );
    event ChallengeJoined(uint256 indexed newId, uint256 indexed parentId, address indexed joiner);
    event CheckedIn(
        uint256 indexed id, address indexed owner, uint8 dayIndex, uint40 timestamp, string note
    );
    event DayMissed(uint256 indexed id, uint8 dayIndex, uint256 amount);
    event GoalBroken(uint256 indexed id, uint8 dayIndex, uint256 forfeitedReward);
    event PoolDistributed(uint256 amount, uint256 accRewardPerWeight, uint256 undistributed);
    event GoalSettled(uint256 indexed id, uint256 refund, uint256 poolShare);
    event Claimed(
        uint256 indexed id, address indexed owner, uint256 refund, uint256 poolShare, uint256 total
    );

    /// @param usdc_ Exact-transfer, six-decimal USDC token to escrow.
    constructor(IERC20 usdc_) {
        if (address(usdc_) == address(0)) revert ZeroTokenAddress();
        usdc = usdc_;
    }

    /**
     * @notice Create a goal starting today and deposit duration * stakePerDay.
     * @param name Habit name, 1..48 UTF-8 bytes (not character count).
     * @param emoji Display emoji, 1..16 UTF-8 bytes.
     * @param duration Exactly 7, 14 or 30 UTC days.
     * @param stakePerDay Daily stake in USDC base units; approve the full deposit first.
     * @return id Newly allocated goal ID, starting at one.
     */
    function createGoal(string calldata name, string calldata emoji, uint8 duration, uint256 stakePerDay)
        external nonReentrant returns (uint256 id)
    {
        if (bytes(name).length == 0 || bytes(name).length > 48) revert InvalidNameLength();
        if (bytes(emoji).length == 0 || bytes(emoji).length > 16) revert InvalidEmojiLength();
        if (duration != 7 && duration != 14 && duration != 30) revert InvalidDuration(duration);
        if (stakePerDay < MIN_STAKE_PER_DAY || stakePerDay > MAX_STAKE_PER_DAY) {
            revert InvalidStake(stakePerDay);
        }
        return _createGoal(name, emoji, duration, stakePerDay, 0);
    }

    /**
     * @notice Copy an existing goal's terms into a new, independently owned goal starting today.
     * @dev The parent may be ended, settled, claimed, broken, or owned by the caller.
     * @param parentId Existing goal whose terms are copied.
     * @return id New goal ID; its deposit requires the joiner's allowance.
     */
    function joinChallenge(uint256 parentId) external nonReentrant returns (uint256 id) {
        Goal storage parent = _requireGoal(parentId);
        Metadata storage meta = _metadata[parentId];
        id = _createGoal(meta.name, meta.emoji, parent.duration, parent.stakePerDay, parentId);
        challengeJoinCount[parentId] += 1;
        emit ChallengeJoined(id, parentId, msg.sender);
    }

    /**
     * @notice Secure today's stake once; past days cannot be backfilled.
     * @param id Caller-owned goal.
     * @param note Optional text or photo URL, at most 280 bytes, emitted but not stored.
     */
    function checkIn(uint256 id, string calldata note) external nonReentrant {
        Goal storage g = _requireOwnedGoal(id);
        if (bytes(note).length > 280) revert NoteTooLong();
        uint256 dayIndex = uint256(currentDay()) - g.startDay;
        if (dayIndex >= g.duration) revert GoalEnded(id);
        uint32 bit = uint32(1) << uint8(dayIndex);
        if ((g.checkedMask & bit) != 0) revert AlreadyCheckedIn(id, uint8(dayIndex));
        g.checkedMask |= bit;
        uint40 timestamp = uint40(block.timestamp);
        checkInTimestamps[id][uint8(dayIndex)] = timestamp;
        _totalKept += g.stakePerDay;
        emit CheckedIn(id, msg.sender, uint8(dayIndex), timestamp, note);
    }

    /**
     * @notice Process all fully elapsed days, at most 30, for any goal.
     * @dev Idempotent if nothing new elapsed. Checked days advance processed without a miss.
     * Each new miss emits DayMissed; the first also emits GoalBroken, followed by distribution.
     */
    function markMissed(uint256 id) external nonReentrant {
        Goal storage g = _requireGoal(id);
        _processDays(id, g);
    }

    /// @notice Process elapsed days for up to 64 goals; unknown IDs revert.
    function markMissedBatch(uint256[] calldata ids) external nonReentrant {
        if (ids.length > 64) revert TooManySweeps();
        for (uint256 i; i < ids.length; ++i) {
            Goal storage g = _requireGoal(ids[i]);
            _processDays(ids[i], g);
        }
    }

    /**
     * @notice Lock the reward and remove an ended perfect goal's weight without paying it.
     * @dev Owner callable at end; others must wait SETTLE_GRACE. Idempotent. Broken goals
     * lock no reward. Does not flush carry merely because weight was removed; the next
     * distribution or creation flushes carry.
     * @param sweepIds Up to 64 goals to process first; target skipped, unknown IDs revert.
     */
    function settle(uint256 id, uint256[] calldata sweepIds) external nonReentrant {
        Goal storage g = _requireGoal(id);
        if (_elapsedDays(g) != g.duration) revert GoalNotEnded(id);
        uint256 endDay = uint256(g.startDay) + g.duration;
        if (msg.sender != g.owner && block.timestamp < endDay * 1 days + SETTLE_GRACE) {
            revert GraceNotElapsed(id);
        }
        _sweepDays(id, sweepIds);
        _settle(id, g);
    }

    /**
     * @notice Settle an ended owned goal and receive secured principal plus reward together.
     * @dev All accounting and the claimed flag are updated before the single token transfer.
     * @param id Caller-owned goal, ended and not previously claimed.
     * @param sweepIds Up to 64 goals to process first; target skipped, unknown IDs revert.
     */
    function claim(uint256 id, uint256[] calldata sweepIds) external nonReentrant {
        Goal storage g = _requireOwnedGoal(id);
        if (g.claimed) revert AlreadyClaimed(id);
        _sweepDays(id, sweepIds);
        _settle(id, g);
        uint256 refund = uint256(_popcount(g.checkedMask)) * g.stakePerDay;
        uint256 reward = g.reward;
        uint256 payout = refund + reward;
        g.claimed = true;
        _reservedRewards -= reward;
        poolBalance -= reward;
        _totalPaidOut += payout;
        emit Claimed(id, msg.sender, refund, reward, payout);
        usdc.safeTransfer(msg.sender, payout);
    }

    /// @notice Full frontend projection; stale missed-day processing never prevents reading it.
    function getGoal(uint256 id) external view returns (GoalView memory v) {
        Goal storage g = _requireGoal(id);
        Metadata storage meta = _metadata[id];
        uint8 elapsed = _elapsedDays(g);
        bool ended = elapsed == g.duration;
        bool checkedToday = !ended && _isChecked(g.checkedMask, elapsed);
        v.id = id;
        v.owner = g.owner;
        v.name = meta.name;
        v.emoji = meta.emoji;
        v.stakePerDay = g.stakePerDay;
        v.duration = g.duration;
        v.startDay = g.startDay;
        v.checkedMask = g.checkedMask;
        v.processed = g.processed;
        v.missedDays = g.missedDays;
        v.parentId = g.parentId;
        v.broken = g.broken;
        v.settled = g.settled;
        v.claimed = g.claimed;
        v.keptDays = _popcount(g.checkedMask);
        v.elapsedDays = elapsed;
        v.currentStreak = _currentStreak(g, elapsed, checkedToday);
        v.checkedToday = checkedToday;
        v.ended = ended;
        v.perfectSoFar = _perfectSoFar(g, elapsed);
    }

    /**
     * @notice Secured refund and estimated pool reward; does not simulate other goals' misses.
     * @dev Existing IDs remain readable before/after settlement or claim. For claimed goals
     * this reports their historical refund and locked reward, not a second claimable balance.
     * An unsettled perfect-so-far share is provisional and capped by unreserved pool funds.
     */
    function previewPayout(uint256 id) external view returns (uint256 refund, uint256 poolShare) {
        Goal storage g = _requireGoal(id);
        refund = uint256(_popcount(g.checkedMask)) * g.stakePerDay;
        if (g.settled) poolShare = g.reward;
        else if (_perfectSoFar(g, _elapsedDays(g))) {
            poolShare = Math.min(_accrued(g), poolBalance - _reservedRewards);
        }
    }

    /// @notice All goal IDs owned by an address, in creation order (including claimed goals).
    function goalsOf(address owner) external view returns (uint256[] memory) {
        return _ownerGoals[owner];
    }

    /// @notice Total goals ever created, also the highest allocated ID.
    function goalCount() external view returns (uint256) {
        return _goalCount;
    }

    /// @notice Current UTC day number since the Unix epoch.
    function currentDay() public view returns (uint32) {
        return uint32(block.timestamp / 1 days);
    }

    /// @notice Missed stakes not yet paid as pool rewards, including locked rewards and dust.
    function poolSize() external view returns (uint256) {
        return poolBalance;
    }

    /// @notice Cumulative goal/deposit/check-in/payout counters and current pool/active weight.
    function stats() external view returns (
        uint256 goals, uint256 totalStaked, uint256 totalKept,
        uint256 poolBalance_, uint256 totalPaidOut, uint256 activeWeight
    ) {
        return (_goalCount, _totalStaked, _totalKept, poolBalance, _totalPaidOut, totalActiveWeight);
    }

    /// @dev Register weight/debt before flushing carry; the new goal shares stranded funds.
    function _createGoal(
        string memory name, string memory emoji, uint8 duration, uint256 stakePerDay, uint256 parentId
    ) private returns (uint256 id) {
        uint256 weight = stakePerDay * duration;
        id = ++_goalCount;
        Goal storage g = _goals[id];
        g.owner = msg.sender;
        g.startDay = currentDay();
        g.duration = duration;
        g.stakePerDay = stakePerDay;
        g.parentId = parentId;
        g.rewardDebt = Math.mulDiv(weight, accRewardPerWeight, SCALE);
        _metadata[id] = Metadata(name, emoji);
        _ownerGoals[msg.sender].push(id);
        totalActiveWeight += weight;
        _totalStaked += weight;
        if (undistributed != 0) _distribute(0);
        uint256 balanceBefore = usdc.balanceOf(address(this));
        usdc.safeTransferFrom(msg.sender, address(this), weight);
        if (usdc.balanceOf(address(this)) != balanceBefore + weight) revert InexactDeposit();
        emit GoalCreated(id, msg.sender, parentId, name, emoji, duration, stakePerDay, g.startDay);
    }

    /// @dev Process supplied goals before locking the target's reward; repeated IDs are harmless.
    function _sweepDays(uint256 targetId, uint256[] calldata sweepIds) private {
        if (sweepIds.length > 64) revert TooManySweeps();
        for (uint256 i; i < sweepIds.length; ++i) {
            uint256 id = sweepIds[i];
            if (id == targetId) continue;
            Goal storage g = _requireGoal(id);
            _processDays(id, g);
        }
    }

    /// @dev First remove broken weight, then redistribute missed stakes plus forfeited rewards.
    function _processDays(uint256 id, Goal storage g) private {
        uint8 elapsed = _elapsedDays(g);
        uint8 newMissed;
        uint256 forfeited;
        for (uint8 i = g.processed; i < elapsed; ++i) {
            if (!_isChecked(g.checkedMask, i)) {
                ++newMissed;
                ++g.missedDays;
                emit DayMissed(id, i, g.stakePerDay);
                if (!g.broken) {
                    g.broken = true;
                    totalActiveWeight -= g.stakePerDay * g.duration;
                    forfeited = _accrued(g);
                    emit GoalBroken(id, i, forfeited);
                }
            }
        }
        g.processed = elapsed;
        if (newMissed != 0) {
            uint256 missedStake = uint256(newMissed) * g.stakePerDay;
            poolBalance += missedStake;
            _distribute(missedStake + forfeited);
        }
    }

    /// @dev A settled goal can never accrue, forfeit or reserve a second reward.
    function _settle(uint256 id, Goal storage g) private {
        if (_elapsedDays(g) != g.duration) revert GoalNotEnded(id);
        if (g.settled) return;
        _processDays(id, g);
        if (!g.broken && g.missedDays == 0) {
            totalActiveWeight -= g.stakePerDay * g.duration;
            g.reward = Math.min(_accrued(g), poolBalance - _reservedRewards);
            _reservedRewards += g.reward;
        }
        g.settled = true;
        emit GoalSettled(id, uint256(_popcount(g.checkedMask)) * g.stakePerDay, g.reward);
    }

    /**
     * @dev Carry only whole base units not already fractionally credited to the accumulator.
     * Rounding consumption up is essential: flooring both the credit and its consumption
     * would repeatedly distribute the same fractional base unit on subsequent flushes.
     * With no active weight the full amount waits for the next keeper to register.
     */
    function _distribute(uint256 amount) private {
        amount += undistributed;
        if (totalActiveWeight == 0) {
            undistributed = amount;
        } else {
            uint256 delta = Math.mulDiv(amount, SCALE, totalActiveWeight);
            accRewardPerWeight += delta;
            uint256 consumed = Math.mulDiv(delta, totalActiveWeight, SCALE, Math.Rounding.Ceil);
            undistributed = amount - consumed;
        }
        emit PoolDistributed(amount, accRewardPerWeight, undistributed);
    }

    /// @dev Nominal whole-base-unit accumulator entitlement, before the reservation safety cap.
    function _accrued(Goal storage g) private view returns (uint256) {
        return Math.mulDiv(g.stakePerDay * g.duration, accRewardPerWeight, SCALE) - g.rewardDebt;
    }

    function _requireGoal(uint256 id) private view returns (Goal storage g) {
        g = _goals[id];
        if (g.owner == address(0)) revert UnknownGoal(id);
    }

    function _requireOwnedGoal(uint256 id) private view returns (Goal storage g) {
        g = _requireGoal(id);
        if (g.owner != msg.sender) revert NotGoalOwner(id);
    }

    function _elapsedDays(Goal storage g) private view returns (uint8) {
        uint256 elapsed = uint256(currentDay()) - g.startDay;
        return elapsed >= g.duration ? g.duration : uint8(elapsed);
    }

    function _perfectSoFar(Goal storage g, uint8 elapsed) private view returns (bool) {
        uint32 elapsedMask = (uint32(1) << elapsed) - 1;
        return !g.broken && (g.checkedMask & elapsedMask) == elapsedMask;
    }

    /// @dev Count backward from today if checked; otherwise yesterday, or the final ended day.
    function _currentStreak(Goal storage g, uint8 elapsed, bool checkedToday)
        private view returns (uint8 streak)
    {
        uint8 cursor = elapsed;
        if (checkedToday) ++cursor;
        while (cursor != 0) {
            --cursor;
            if (!_isChecked(g.checkedMask, cursor)) break;
            ++streak;
        }
    }

    function _isChecked(uint32 mask, uint8 dayIndex) private pure returns (bool) {
        return (mask & (uint32(1) << dayIndex)) != 0;
    }

    function _popcount(uint32 mask) private pure returns (uint8 count) {
        while (mask != 0) {
            mask &= mask - 1;
            ++count;
        }
    }
}
