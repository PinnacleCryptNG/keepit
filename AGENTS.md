# KeepIt

> Built with Arc Studio. Project memory for future agents and humans.

## What This App Does

KeepIt is a habit-staking app on Arc mainnet (real USDC, unaudited, max $5/day). Users stake USDC on a daily goal (7, 14 or 30 days), check in daily (days follow the goal's own time zone; optional contract-enforced check-in window and minimum wallet balance), and claim their stake back plus a share of the pool of missed stakes if they finish. Tagline: "Keep the streak. Keep your money." Includes a Wall of Keepers leaderboard, friend challenge links (`/?join=<goalId>`), light/dark mode and a seeded demo mode.

## Deployed Contracts

- KeepIt (Arc mainnet, chain 5042): `0x58E881aD141ac1772a8b7E82d5e2CaA37b1E7c4E` (WARNING: this deployment is the older v1 contract, not the v2 this app is built for. The app shows "Contract version mismatch" until a v2 address replaces it.)
- Previous Arc Testnet v2: `0x5fae40e4e2becddf868dca65ed109a7bb88b91e2`
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
- Chain: Arc mainnet; money in the 6-decimal USDC ERC-20 view only (use `@/onchain-money`)

## Architecture

- `src/App.tsx`: composition root. `src/landing/*` is the marketing page, `src/app/*` is the app (one centered column: a Today list with check-in on each card, a detail sheet, a short New keep flow, and a Wall; tab bar at the bottom on phones), `src/brand/*` holds the logo and flame art.
- Routing is query-string only (`?app=keeps|start|wall`, `?docs=1`, `?join=<id>`), so every URL is the same static page.
- Design tokens live in `src/index.css` (paper/ink/ember, sticker surfaces). Custom classes sit in `@layer components` so Tailwind utilities can override them. After editing `tailwind.config.js`, restart the dev server.
- Brand assets: `bun run assets` (needs `design/fonts`).
- `src/hooks/useLiveEngine.ts`: reads/writes the real contract. `src/hooks/useDemoEngine.ts`: in-memory seeded simulation. Both return the same `KeepApi` (`src/lib/types.ts`); `useMode` picks one (default demo, `?join=` links default to live, `&demo=1` forces demo).
- `analyze()` in `src/lib/types.ts` derives calendar cells, streak, money safe/lost from a goal's bitmask and the UTC day.
- `src/lib/share.ts`: share-link helper; challenge links are built with `getShareBase()`.

## To Run

```bash
bun install
bun run dev
bun run check
```

## Mainnet

- `src/lib/keepit.ts` is hard-wired to Arc mainnet (`arc`, 5042) and throws if `VITE_CHAIN_ID` is set to anything else. Stake limits (`MIN_STAKE_PER_DAY`, `MAX_STAKE_PER_DAY` = $5) must match the deployed contract.
- Deploy script: `contracts/script/DeployKeepIt.s.sol` (refuses non-Arc chains). Full steps: `docs/mainnet-checklist.md`. Arc Studio does not deploy to mainnet; the owner does it outside Studio.
