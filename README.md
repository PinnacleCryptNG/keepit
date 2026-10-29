# KeepIt

Put USDC on your habit. Pick a daily goal, stake a little USDC for 7, 14 or 30 days, check in every day and get your stake back, plus a share of what quitters leave behind. **Keep the streak. Keep your money.**

Built with [Arc Studio](https://studio.arc.io)

## What you can do

- Connect a wallet and see your USDC balance on Arc Testnet.
- Create a goal with a name, emoji, length (7, 14 or 30 days) and a daily stake. The full stake goes into escrow.
- Check in once a day with an optional note or photo link. A flame lights up for every day kept and a crack marks every day missed.
- Watch your streak and how much of your money is still safe.
- Claim your returned stake and pool share in one click when the goal ends.
- Browse the Wall of Keepers: longest active streaks, total USDC kept and the current pool size.
- Challenge a friend with a share link. They join the same goal with the same stake, on their own streak.
- Switch between light and dark mode.

## Demo mode

Demo mode is on by default. It comes with seeded goals, streaks, a pool and 25 practice USDC, so you can explore without waiting days or spending anything. Use **Skip a day** to watch unchecked goals crack and the pool grow, then **Reset** to start over. Flip the **Live** switch in the header to use the real contract on Arc Testnet with your own wallet.

## Contract

- Network: Arc Testnet (chain ID 5042002)
- Token: USDC at `0x3600000000000000000000000000000000000000`
- KeepIt contract: `0x3c8f6a0f5603a3299c037b6af7d2586d3930b689`
- Explorer: https://explorer.testnet.arc.io/address/0x3c8f6a0f5603a3299c037b6af7d2586d3930b689

Testnet only. Use the "Get test USDC" button in the Arc Studio sidebar, or https://faucet.circle.com, to fund your wallet.

## How payouts work

1. **Stake.** When you create a goal, daily stake times number of days goes into escrow. Nothing else is ever charged.
2. **Every day is UTC.** Day 1 is the day you create the goal. Each day closes at midnight UTC, and you get one check-in per day.
3. **Kept days are safe.** Each day you check in, that day's stake is secured for refund.
4. **Missed days feed the pool.** A day with no check-in loses that day's stake to the shared pool.
5. **Perfect keepers share the pool.** If you finish with no missed days, you get your whole stake back plus a share of the pool, weighted by how much you staked.
6. **Imperfect finishers still get kept days back.** Finish with a miss and you get the stake of the days you kept, but no pool share.
7. **Claim once.** When the goal ends, claiming pays your refund and pool share in a single transfer.

The pool pays out as missed days are counted. A keeper earns a share of every missed stake counted while their goal is still open, so claiming after more goals have ended can mean a bigger share. Anyone can count missed days into the pool (the Wall has a button for it), and claiming also counts the ones the app knows about first. A keeper who does not claim within a week of finishing can be settled by anyone, so unclaimed weight does not dilute everyone else forever.

Check-in notes and photo links are public and are not verified. KeepIt is a self-reported habit tracker with money on the line.

## Tech stack

React 18, Vite, TypeScript, Tailwind CSS, wagmi, viem and ConnectKit for the app. Solidity 0.8.28 with Foundry and OpenZeppelin for the contract. Network: Arc Testnet.

## Development

Prerequisites: [Bun](https://bun.sh) and [Foundry](https://book.getfoundry.sh) (only needed for contract work).

```bash
bun install
bun run dev        # start the app on http://localhost:5173
bun run check      # lint and typecheck
bun run contracts:build   # compile the contract
bun run contracts:test    # run contract tests
```

### Environment variables

| Name | Purpose |
| --- | --- |
| `VITE_KEEPIT_ADDRESS` | Address of the deployed KeepIt contract the app talks to. |

Restart the dev server after changing `.env`.

### Use your own contract

Compile the contract with `bun run contracts:build`, deploy `contracts/KeepIt.sol` to Arc Testnet with the USDC address above as its only constructor argument, and set `VITE_KEEPIT_ADDRESS` to the new address.
