import "./landing.css";

import { Footer } from "@/components/landing/Footer";
import { LiveCursors } from "@/components/landing/LiveCursors";
import { Marquee } from "@/components/landing/Marquee";
import { PixelIcon } from "@/components/landing/PixelIcon";
import {
  BalanceVisual,
  EarningsVisual,
  TrustVisual,
} from "@/components/landing/ProductVisuals";
import { SettlementWidget } from "@/components/landing/SettlementWidget";
import { PLATFORM_FEE_BPS, RATE_PER_PLAY, SETTLEMENT, fmt } from "@/lib/settlement";

const TL_SLOTS = 48;

function Timeline({ variant }: { variant: "old" | "new" }) {
  return (
    <div className="tl">
      {Array.from({ length: TL_SLOTS }, (_, i) => (
        <i
          key={i}
          className={variant === "new" || i === TL_SLOTS - 1 ? "on" : undefined}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const { fee, net, shares } = SETTLEMENT;

  return (
    <>
      <nav className="nav">
        <div className="nav-box">
          <span className="brand">
            CLEARTUNE<i>.</i>
          </span>
          <a className="btn btn-purple" href="/login">
            OPEN APP
          </a>
        </div>
      </nav>

      <main>
        <div className="shell hero">
          <div className="eyebrow" style={{ marginBottom: "var(--s3)" }}>
            ON-CHAIN MUSIC ROYALTIES &middot; MONAD
          </div>
          <h1>
            NOT ONCE EVERY 6 MONTHS.
            <br />
            <em>EVERY PLAY.</em>
          </h1>
          <p className="lede">
            The moment a song plays, the money splits to every rights holder right then —
            not batched, not promised.
          </p>
          <div className="cta">
            {/* Two CTAs map differently (auth map decision). `?role=` picks the
                copy on /signup and the card on the role picker screen — it
                doesn't lock anything in. Someone who already has a session
                isn't held up: /signup drops them straight at their destination. */}
            <a className="btn" href="/signup?role=listener">
              LISTEN NOW
            </a>
            <a className="btn btn-ghost" href="/signup?role=artist">
              I'M AN ARTIST
            </a>
          </div>

          <SettlementWidget />
        </div>

        <Marquee />

        <section className="act shell" id="problem" aria-labelledby="h-problem">
          <div className="eyebrow" style={{ marginBottom: "var(--s3)" }}>
            THE PROBLEM
          </div>

          <div className="split">
            <h2 className="act-head" id="h-problem">
              PAID LAST.
              <br />
              ALWAYS.
            </h2>
            <p className="lede">
              Royalties are batched every six months. The whole time, the song is working,
              but the money sits in someone else's hands. The breakdown isn't disclosed, the
              cuts aren't explained, and until it's paid out there's no way to verify the
              math is right.
            </p>
          </div>

          <div className="cmp-grid">
            <div className="cmp bad">
              <div className="cmp-hd">
                <PixelIcon name="lock" />
                <span className="lbl">THE OLD WAY</span>
              </div>
              <Timeline variant="old" />
              <div className="tl-cap">
                <span className="k">Six months, nothing happens.</span>
                <span className="v">1&times;</span>
              </div>
              <div className="li">Batched every 6 months</div>
              <div className="li">Breakdown hidden</div>
              <div className="li">Cuts unexplained</div>
              <div className="li">Split sheet lives in email</div>
            </div>

            <div className="cmp good">
              <div className="cmp-hd">
                <PixelIcon name="split" />
                <span className="lbl">HERE</span>
              </div>
              <Timeline variant="new" />
              <div className="tl-cap">
                <span className="k">Every play, split instantly.</span>
                <span className="v">48&times;</span>
              </div>
              <div className="li">Split on every play</div>
              <div className="li">Every play has a tx hash</div>
              <div className="li">8% fee, written in the contract</div>
              <div className="li">Split permanent on-chain</div>
            </div>
          </div>
        </section>

        <section className="act shell" id="how-it-works" aria-labelledby="h-product">
          <div className="eyebrow" style={{ marginBottom: "var(--s3)" }}>
            HOW IT WORKS
          </div>
          <div className="split">
            <h2 className="act-head" id="h-product">
              THREE SIDES.
              <br />
              ONE FLOW.
            </h2>
            <p className="lede">
              Listeners top up a balance. Artists get paid every play. The trust layer keeps
              the chart honest.
            </p>
          </div>

          <div className="pblock">
            <div className="pb-text">
              <div className="eyebrow">
                <i>01</i> LISTENER SIDE
              </div>
              <h3 className="pb-title">
                TOP UP.
                <br />
                <em>KEEP LISTENING.</em>
              </h3>
              <p className="lede">
                Top up a balance up front, like phone credit. Every play deducts a fixed
                amount and splits it to artists instantly. Balance runs out, listening stops
                until you top up again — no free tier.
              </p>
            </div>
            <div className="pb-visual">
              <BalanceVisual />
            </div>
          </div>

          <div className="pblock flip">
            <div className="pb-text">
              <div className="eyebrow">
                <i>02</i> ARTIST SIDE
              </div>
              <h3 className="pb-title">
                THE MONEY'S
                <br />
                <em>ALREADY THERE.</em>
              </h3>
              <p className="lede">
                Your balance grows on every play, not every quarter. Withdraw anytime, no
                minimum, no schedule. The split sheet is written once at registration and
                can never be changed after.
              </p>
            </div>
            <div className="pb-visual">
              <EarningsVisual />
            </div>
          </div>

          <div className="pblock">
            <div className="pb-text">
              <div className="eyebrow">
                <i>03</i> TRUST LAYER
              </div>
              <h3 className="pb-title">
                FAKE PLAYS
                <br />
                <em>DON'T CLIMB.</em>
              </h3>
              <p className="lede">
                The chart is computed from trust-weighted plays, not raw counts. A wallet
                replaying one song over and over still gets paid, but its weight drops.
                Payment and ranking run on separate rails.
              </p>
            </div>
            <div className="pb-visual">
              <TrustVisual />
            </div>
          </div>
        </section>

        <section className="act shell" id="proof" aria-labelledby="h-proof">
          <div className="eyebrow" style={{ marginBottom: "var(--s3)" }}>
            THE PROOF
          </div>
          <div className="split">
            <h2 className="act-head" id="h-proof">
              ONE PLAY.
              <br />
              ONE RECEIPT.
            </h2>
            <p className="lede">
              Every play writes one transaction: who paid, who received, how much each
              share was. Nothing hidden until the end of the quarter.
            </p>
          </div>

          <div className="close">
            <div className="close-hd">
              <span className="t">SETTLEMENT RECEIPT</span>
              <span className="b">sample single play</span>
            </div>

            <div className="close-body">
              <div className="rc">
                <span className="k">Tx</span>
                <span className="data pending">waiting for the first play in production</span>
              </div>
              <div className="rc">
                <span className="k">Network</span>
                <span className="data">Monad Testnet</span>
              </div>
              <div className="rc">
                <span className="k">Funded by</span>
                <span className="data">listener balance</span>
              </div>

              <div className="ledger">
                <div className="eyebrow">IN</div>
                <div className="row">
                  <span className="k">Rate per play</span>
                  <span className="v">{fmt(RATE_PER_PLAY)} mUSD</span>
                </div>
              </div>

              <div className="ledger">
                <div className="eyebrow">OUT</div>
                <div className="row">
                  <span className="k">
                    Platform fee <span className="bps">{PLATFORM_FEE_BPS} bps</span>
                  </span>
                  <span className="v acc">{fmt(fee)}</span>
                </div>
                {shares.map((p) => (
                  <div className="row" key={p.name}>
                    <span className="k">
                      {p.name} <span className="bps">{p.bps} bps</span>
                    </span>
                    <span className="v">{fmt(p.amount)}</span>
                  </div>
                ))}
              </div>

              <div className="total">
                <span className="k">SPLIT</span>
                <span className="v">{fmt(RATE_PER_PLAY)}</span>
              </div>

              <div className="check">
                <div className="eyebrow">CHECK THE MATH</div>
                <div className="check-line">
                  {RATE_PER_PLAY} &minus; {fee} = {net}
                </div>
                <div className="check-line">
                  {net} = {shares.map((p) => p.amount).join(" + ")}
                </div>
              </div>

              <p className="honesty">
                The numbers on this page are computed from the same contract parameters
                live on Monad testnet — not made up.
              </p>
            </div>
          </div>

          <div className="close-cta">
            <a className="btn btn-purple" href="/signup?role=listener">
              LISTEN NOW
            </a>
            <a className="btn btn-ghost" href="/signup?role=artist">
              REGISTER A SONG
            </a>
          </div>
        </section>
      </main>

      <Footer />

      <LiveCursors />
    </>
  );
}
