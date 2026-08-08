# ClearTune — 3-Minute Pitch Script (English)

Structured for: intro → problem → solution → live demo → why Monad → close.
Timestamps assume you're clicking through the demo *while* talking, not after.
Practice out loud with a timer at least twice — 3 minutes disappears fast once you add real clicks and load time.

---

## Full script

### [0:00 – 0:15] Hook
> "Right now, if you're a musician on Spotify, you get paid once every six months. Your song works every single day — but your money sits in someone else's account for half a year. That's not a technical limitation. That's a choice. We're here to change it."

### [0:15 – 0:35] Problem
> "The real problem isn't the amount — it's trust and timing. Royalties are batched, opaque, and slow. You don't know exactly how much you're owed, or why. Split sheets live in emails and PDFs, not in anything you can independently verify."

### [0:35 – 1:05] Solution
> "ClearTune pays musicians per play, in real time, on-chain. Listeners top up a balance — think of it like phone credit. Every time a song plays, a small amount is deducted and instantly split to every rights holder, according to a split sheet that's permanently written on-chain. No waiting, no recap, no trusting a middleman — anyone can verify every transaction themselves."

### [1:05 – 2:15] Live demo (~70s — keep lines short, let clicks breathe)
> "Let me show you — and this isn't a mockup. This contract is deployed and verified, live, on Monad testnet, right now."

- **[click: catalog]** "Here's the catalog. Every song here has a permanent, on-chain split sheet."
- **[click: connect wallet + top up]** "I connect my wallet and top up my balance in our demo stablecoin, mUSD."
- **[click: play a song]** "I hit play — that's a real on-chain transaction. Watch the artist's dashboard: the payment already landed, split automatically between every rights holder."
- **[click: drain balance / show stop state]** "And when my balance runs out — playback stops. No free tier, no hidden subsidy. That's deliberate: this business model can never run at a loss."
- **[click: trust/chart panel]** "Behind the scenes, a trust layer is scoring every wallet, catching wash trading and fake plays. But notice — it never blocks a payment. It only adjusts chart ranking. Money and trust run on two completely separate rails."

### [2:15 – 2:40] Why Monad
> "None of this works on a normal chain. A single play is worth a few cents — on most chains, the gas fee alone would cost more than the payment. Monad's sub-second blocks are what make settlement this granular, this frequent, actually possible."

### [2:40 – 3:00] Close
> "ClearTune isn't a concept slide. It's a live, verified smart contract, settling real payments, on every single play. Thank you."

---

## Condensed cue cards (glance-while-presenting version)

1. **Hook** — Spotify pays every 6 months. Song works daily, money doesn't move. We fix that.
2. **Problem** — Batched, opaque, unverifiable. Trust issue, not an amount issue.
3. **Solution** — Top up balance → every play deducts + splits on-chain, instantly, permanently.
4. **Demo beats** — catalog → connect + top up → play → dashboard updates live → balance runs out → stops (no free tier) → trust layer only affects chart, never payment.
5. **Why Monad** — Per-play value is tiny; normal-chain gas costs more than the payment. Sub-second blocks make this math work.
6. **Close** — Live. Verified. Real payments. Not a slide.

---

## Delivery notes

- **Say "live on Monad testnet" and mean it** — you have a real verified contract address. If a judge asks, you can pull up the explorer on the spot. That's your strongest card — use it early in the demo, not just in Q&A.
- **Don't narrate every click.** One short sentence per action, then let the screen do the talking for a beat.
- **If a page/transaction is slow to load**, keep talking through the *why* (e.g. "while that confirms — this is Monad's sub-second block time doing its job") instead of standing in silence.
- **Cut ruthlessly if you're running long**: the "Why Monad" section is the first thing you can compress to one sentence — the demo and the close matter more.
