# KeepIt

> Built with Arc Studio. Project memory for future agents and humans.

## What This App Does

KeepIt is a habit-staking app on Arc Testnet. Users stake USDC on a daily goal (7, 14 or 30 days), check in daily (UTC days), and claim their stake back plus a share of the pool of missed stakes if they finish. Tagline: "Keep the streak. Keep your money." Includes a Wall of Keepers leaderboard, friend challenge links (`/?join=<goalId>`), light/dark mode and a seeded demo mode.

## Deployed Contracts

- KeepIt (Arc Testnet, chain 5042002): `0x3c8f6a0f5603a3299c037b6af7d2586d3930b689`
  - Constructor arg: USDC `0x3600000000000000000000000000000000000000`
  - Address lives in `.env` as `VITE_KEEPIT_ADDRESS` (restart Vite after changing it).
  - ABI copy: `src/lib/keepitAbi.ts` (regenerate from `contracts/out/KeepIt.sol/KeepIt.json` after any contract change).

## Contract design notes

- Pool is an accumulator ("stream"): perfect keepers earn a share of each missed stake processed while their goal is unsettled. Order of processing matters by design.
- `claim(id, sweepIds)` processes the passed goals' missed days first. The app passes every known goal with pending misses.
- Non-owners can only settle a goal 7 days after it ended.
- Security review: two review passes, one High fixed (settlement-order); Slither clean of High. No unit tests written (balanced review level).

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS v3, framer-motion
- Web3: wagmi v2, viem, ConnectKit (injected wallets)
- Contracts: Solidity 0.8.28 + Foundry in `contracts/`
- Chain: Arc Testnet; money in the 6-decimal USDC ERC-20 view only (use `@/onchain-money`)

## Architecture

- `src/App.tsx`: composition root, tabs (My keeps / Start / Wall), challenge-link sheet.
- `src/hooks/useLiveEngine.ts`: reads/writes the real contract. `src/hooks/useDemoEngine.ts`: in-memory seeded simulation. Both return the same `KeepApi` (`src/lib/types.ts`); `useMode` picks one (default demo, `?join=` links default to live, `&demo=1` forces demo).
- `analyze()` in `src/lib/types.ts` derives calendar cells, streak, money safe/lost from a goal's bitmask and the UTC day.
- `src/lib/share.ts`: share-link helper; challenge links are built with `getShareBase()`.

## To Run

```bash
bun install
bun run dev
bun run check
```
