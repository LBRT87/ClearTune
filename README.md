# ClearTune

ClearTune is a transparent, pay-as-you-go music streaming and royalty platform built on the Monad blockchain. Every play is settled on-chain in real time: a listener tops up a balance in mUSD, and each play instantly splits that payment between the song's payees (artist, producer, label, etc.) according to royalty shares fixed at registration — no subscriptions, no opaque monthly pools, no waiting for a quarterly payout.

## Why ClearTune

Traditional streaming royalties are pooled, delayed, and opaque — artists have no way to verify that a play actually turned into a payment, or how the split was calculated. ClearTune solves this by moving settlement on-chain:

- **Pay-per-play, not pooled subscriptions.** Listeners top up a balance; each play deducts a fixed rate directly from that balance.
- **Instant, transparent splits.** Royalty shares (in basis points) are set once when a song is registered and enforced by the smart contract on every single play.
- **Trust-weighted charts.** A trending algorithm scores listening activity by wallet trust (entropy of listening patterns, funding-cycle detection, etc.) so streaming farms and wash-trading can't easily fake their way to the top.
- **Pull-payment withdrawals.** Artists withdraw their accumulated earnings whenever they want; funds are never held by a custodian beyond the contract itself.

## How it works

1. **Register a song** — an artist registers a song on-chain with a list of payees and their royalty split in basis points (must total exactly 10,000 = 100%).
2. **Top up balance** — a listener tops up their mUSD balance to start listening.
3. **Play a song** — the backend reports plays to the contract in batches (`reportPlays`). Each play deducts a fixed `ratePerPlay` from the listener's balance and instantly credits it to the song's payees, minus a small platform fee. If a listener's balance is too low for a given play, that single play is skipped without reverting the rest of the batch.
4. **Withdraw earnings** — payees withdraw their accumulated earnings from the contract at any time.
5. **Trending chart** — play data is aggregated and weighted by each listening wallet's trust score, so the trending chart reflects genuine listening activity rather than raw play counts.

## Tech Stack

- **Smart contracts:** Solidity 0.8.24, Foundry, deployed on Monad Testnet
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Wallet & auth:** Privy, wagmi, viem
- **Backend/data:** Supabase (Postgres, Storage, Auth)

## Project Structure

```
contracts/   Solidity smart contracts (Foundry project)
frontend/    Next.js web app
```

## Smart Contracts (Monad Testnet, chain ID 10143)

| Contract | Address |
|---|---|
| ClearTune | [`0x110510745346A154f8Bc55c6825A34D0c29d49e8`](https://testnet.monadexplorer.com/address/0x110510745346A154f8Bc55c6825A34D0c29d49e8) |
| MockUSD (mUSD) | [`0x3F520E08A7227f8672b593B42A3B25f1806C2f41`](https://testnet.monadexplorer.com/address/0x3F520E08A7227f8672b593B42A3B25f1806C2f41) |

## Getting Started

### Smart contracts

```bash
cd contracts
forge build
forge test
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Team

Built for the Monad Blitz Jakarta hackathon.

| Name | Role |
|---|---|
| Elbert Joan | Smart Contract |
| I Wayan Sudana Dyaksa | Frontend |
| Jason Kenneth Lay | Frontend |
