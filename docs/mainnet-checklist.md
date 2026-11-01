# KeepIt mainnet checklist

You deploy and operate everything here yourself, outside Arc Studio. Arc Studio does not deploy to, sign for or fund mainnet. Mainnet transactions use real USDC and cannot be reversed.

Facts used below come from the Arc docs (docs.arc.io): Arc mainnet chain ID `5042`, RPC `https://rpc.mainnet.arc.io`, explorer `https://explorer.arc.io`, USDC (ERC-20 view, 6 decimals) at `0x3600000000000000000000000000000000000000`, the same address as on testnet. Re-check them against the docs before you sign anything.

## 0. Do not skip: things that must happen before real funds

1. **Independent audit of `contracts/KeepIt.sol`.** The contract has only had automated analysis (Slither) and two AI-assisted review passes. There are no unit tests in the repo. It is immutable and has no pause switch or admin, so a bug cannot be patched after launch; the fix is a new contract at a new address.
2. **Tests that run on Arc's runtime.** Arc differs from Ethereum (native USDC, blocklist, fee floor, no PREVRANDAO). Install Arc Foundry (https://docs.arc.io/arc/tutorials/install-arc-foundry.md) and run your tests with `arc-forge test --network arc`. Cover: the pool maths over many keepers, local-day rollover for offsets from -12h to +14h, window edges, and the balance rule.
3. **A full-cycle rehearsal.** On mainnet the shortest keep is 7 real days. Rehearse a whole cycle (create, check in, a friend slips, settle, claim) first on a mainnet fork with `arc-anvil --network arc` and warp time, or on testnet.
4. **Launch limits.** `MAX_STAKE_PER_DAY` is 100 USDC, so one keep can lock up to 3,000 USDC. Because the contract is immutable and young, consider lowering that constant (for example to 5 or 10 USDC) before you deploy. Change it in `contracts/KeepIt.sol`, then re-run the review.
5. **Legal review** of `?docs=1` (Terms, risks, the "is this gambling" note) for the countries you will serve. The text in the app is a plain-language draft, not legal advice.
6. **Contact and source links.** Set `VITE_CONTACT_URL`, `VITE_REPO_URL` and `VITE_X_HANDLE`, and push the code to the repository you link.

## 1. Deployer wallet

- Use a fresh wallet used only for this deploy. A hardware wallet or an encrypted keystore is best.
- Import a key into an encrypted keystore instead of passing it on the command line:

  ```bash
  cast wallet import keepit-deployer --interactive
  ```

- Mainnet gas is paid in USDC. There is no faucet on mainnet. Per Circle's Arc guidance, request gas USDC through your Circle point of contact, then fund the deployer address. A deploy needs only a small amount.
- Nobody gets special rights from deploying: the contract has no owner. Keep the deployer key anyway, and keep it out of chat, source control and `.env` files that are committed.

## 2. Deploy

```bash
export ARC_MAINNET_RPC_URL=https://rpc.mainnet.arc.io

# 1. Build exactly what you audited
arc-forge build

# 2. Dry run: simulates against mainnet, sends nothing
arc-forge script contracts/script/DeployKeepIt.s.sol \
  --rpc-url $ARC_MAINNET_RPC_URL \
  --account keepit-deployer

# 3. The real deploy: this spends real gas and cannot be undone
arc-forge script contracts/script/DeployKeepIt.s.sol \
  --rpc-url $ARC_MAINNET_RPC_URL \
  --account keepit-deployer \
  --broadcast
```

`DeployKeepIt.s.sol` refuses to run on any chain other than Arc mainnet (5042) or Arc Testnet (5042002), checks that the USDC predeploy exists, and passes `0x3600...0000` to the constructor. Plain `forge` also works if you do not have Arc Foundry, but Arc's docs recommend Arc Foundry for Arc-specific behaviour.

Write down the deployed address and the transaction hash.

## 3. Verify the deployment before announcing it

```bash
ADDR=0x...            # your mainnet KeepIt address
cast chain-id --rpc-url $ARC_MAINNET_RPC_URL                       # expect 5042
cast call $ADDR "usdc()(address)" --rpc-url $ARC_MAINNET_RPC_URL    # expect 0x3600000000000000000000000000000000000000
cast call $ADDR "goalCount()(uint256)" --rpc-url $ARC_MAINNET_RPC_URL   # expect 0
# On-chain code must match your local build
cast code $ADDR --rpc-url $ARC_MAINNET_RPC_URL | cast keccak
forge inspect KeepIt deployedBytecode | cast keccak
```

The two hashes match only if constructor immutables are the only difference; if they differ, compare after zeroing the immutable slot or ask your auditor to confirm. Then publish the source on the explorer if it offers contract verification, so users can read it.

## 4. Point the app at mainnet

Set these in `.env` (never commit secrets; none of these are secret):

```ini
VITE_CHAIN_ID=5042
VITE_KEEPIT_ADDRESS=0x...        # the mainnet address from step 2
VITE_REPO_URL=https://github.com/...
VITE_CONTACT_URL=mailto:you@example.com
VITE_X_HANDLE=yourhandle
VITE_WALLETCONNECT_PROJECT_ID=...   # optional, free from cloud.reown.com
```

- The app is built for Arc mainnet only. It refuses to start if `VITE_CHAIN_ID` is set to anything other than `5042`, so a typo cannot point it at another network.
- With `5042` the app switches to the Arc mainnet RPC and explorer, drops the faucet links, and the FAQ and terms say stakes are real USDC.
- Rebuild and redeploy the site (`bunx vite build`), then open it and check the network name and the contract link in the footer.
- Wallets will prompt users to add or switch to Arc (chain 5042).
- The old testnet contract stays on testnet. Goals there are separate and cannot be moved.

## 5. Smoke test with tiny amounts

Use a wallet you control and 0.01 USDC a day stakes. Confirm in the explorer that each step matches the app:

1. Create a 7-day keep with a window and a minimum balance. Confirm the deposit equals `days x stake`.
2. Check in inside the window. Try once outside it and confirm it fails.
3. Join the challenge from a second wallet.
4. Let a day pass uncounted, call "Update" on the Wall, confirm the pool changes by exactly one day's stake.
5. After the last day: claim, and confirm refund plus pool share equals what the app showed.

## 6. Day-two operations

- Watch contract events (`GoalCreated`, `CheckedIn`, `DayMissed`, `GoalSettled`, `Claimed`) for anything unexpected. Do not scan from block 0: start from the deployment block.
- Missed days are only moved into the pool when someone triggers it. The Wall has a button; consider a small keeper script that calls `markMissedBatch` on a schedule so the pool is always current.
- There is no pause. If a serious bug appears, you can only stop sending users to the contract (take the site down or switch the address) and tell people to claim what they can.
- Use more than one RPC provider for production (Arc lists Alchemy, Blockdaemon, dRPC and QuickNode) and add a fallback.
- Arc specifics to remember: a USDC transfer involving a blocklisted address reverts, and the mempool has a minimum fee floor, so give failed-transaction messages that explain this.

## 7. What to tell users and auditors

- Check-ins prove what the wallet did (inside a window, with a balance), not what the person did. Say so wherever you describe verification.
- The pool is a stream: a keeper shares in missed stakes processed while their goal is unsettled. Late processing can change shares; claimers can pass goals to sweep first.
- Daylight saving is not modelled; each goal's offset is fixed at creation.
- Rounding dust can remain in the contract and is never over-paid.
