# Tally

Receipts for prediction calls. Every bet the agent places on DreamDEX Event Contracts mints a verifiable receipt carrying its real transaction. Settlement is checked against the chain, not claimed. The board ranks by settled truth.

**Live: https://tally-dreamdex.vercel.app** · repo `A-Raphie/tally` · verdict cards derive from the indexer's fill tape (no per-instance store)

## Judge path (under 90 seconds)

1. Open the app. Live binary markets from DreamDEX testnet are already listed with countdowns.
2. Tap **Bet YES** on any market. The agent wallet places a real IOC order on the Somnia Shannon testnet order book and a receipt appears: serial, entry, size, price, and the tx hash linked to the block explorer.
3. Wait for expiry (or open a market that already expired), tap **Settle against chain**. Each receipt flips to WON, LOST or VOID with payout math derived from the market's onchain resolution.
4. The board below aggregates every wallet by settled outcomes only.

Three receipts were placed live during the build; see the honesty table for their hashes.

## Why

Agent prediction-market entries everywhere come with unverifiable P&L screenshots. Tally's answer: a verdict card per call, anchored to a real fill, resolved by the chain, with its provenance one tap away. Trust moves from claims to artifacts.

## How it works

- **Market discovery:** `@somnia-chain/markets-sdk` on the Somnia Shannon testnet (chain 50312). Only binary markets with more than 2 minutes to expiry are listed; each row carries its live countdown.
- **Order placement:** the server-side agent wallet crosses the YES book with an IOC limit at ask plus 2 cents, sized in tUSDC. Reverts throw; receipts are written only for confirmed fills.
- **Verdict cards:** each confirmed fill mints a card (serial, verdict chip, tx hash, orderId, market, symbol, size, price, timestamp, wallet) with an expandable provenance panel carrying the fill transaction and market id. The chain is the source of truth; the store is an append-log.
- **Settlement:** the settle pass looks up each OPEN receipt's market on the indexer. Finalized markets resolve via `winningOutcome`: YES win pays 1 tUSDC per contract, loss pays 0, voided markets pay 0.5. Nothing is marked settled until the indexer says finalized.
- **Board:** aggregation over settled receipts only, per wallet.

## Stack

Next.js (App Router) + TypeScript + Tailwind, `@somnia-chain/markets-sdk` 0.29, viem. No database: the card log is a JSON file, sufficient for one agent and honest about it.

## Run it

```
npm install
npm run dev
```

Environment (`.env`, never committed):

```
TALLY_TEST_PRIVATE_KEY=0x...   # Somnia Shannon testnet wallet
```

Gas: claim STT at https://testnet.somnia.network/. Collateral: tUSDC self-mints via the faucet on `0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E` (10,000 per call).

## Honesty table

| Claim | Status |
|---|---|
| Live order placement on DreamDEX testnet | Proven on both sides. YES fills: three earlier txs plus `0x61d3fbc4260e5ae2`; NO fill: `0x6defc8e6a095bd4b` (`ETH-0-09SEP26-2100-8624/tUSDC#NO` at 0.741). Original three: spike `0x623efd7af6101cd28c80cc787ee444087301bf63256d6609cec61f49c6ac0d80`, app receipts `0x82b7ca65b7fc7d57f34db72ecf917edd9ba6a1f86bdab2467c4ee7b2919e551f` and `0xf39b045717f2f3adfff27276fd83f10b4b42c454f2fdf48c1a309d9abf5ba156`. |
| Settlement against chain resolution | Proven both ways for YES positions. NO positions settle through the same code path (NO wins when the resolution names outcome 1); a live NO settlement has not been observed yet. | Receipt `0x82b7ca65...` resolved LOST (payout 0) and receipt `0xf39b0457...` resolved WON (payout 2.00 tUSDC: 2 contracts staked at 0.57, returned 2.00), each after its market finalized on the indexer. |
| Receipt per fill with explorer link | Proven in the running app. |
| Board ranked by settled truth | Working; aggregates the receipts above. |
| Per-device marks | Cards a visitor's clicks directed are marked 'your call' via that browser's localStorage. Marks are per-browser, not per-person. |
| Deployed on Vercel | Live at https://tally-dreamdex.vercel.app. Verdict cards are stateless: every visit derives the full tape from the indexer, so every viewer on every instance sees the same cards. The chain is the database. |
| Multi-wallet support | Single agent wallet in this build. The board is wallet-keyed and ready for more. |
| Redemption of winnings | Not implemented: settlement marks receipts and math only; onchain redeem via the trader tier is the documented next step. |

## Scope cuts

No orderbook depth chart, no user wallets (one agent wallet is the product), receipts stored per runner rather than onchain. Both sides trade: YES fills on the YES book, NO fills on the NO book; the desk quotes NO at the mirrored ask.

## Submission

Somnia x DreamDEX Event Contracts Hackathon on DoraHacks. Repo is the public open-source submission. Built by [Raphie](https://x.com/a_raphie).
