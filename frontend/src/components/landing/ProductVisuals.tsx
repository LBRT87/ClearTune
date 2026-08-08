const BALANCE_SLOTS = 40;

export function BalanceVisual() {
  return (
    <>
      <div className="meter-cap">
        <span className="k">Balance</span>
        <span className="v">0.000000 mUSD</span>
      </div>
      <div className="bar">
        {Array.from({ length: BALANCE_SLOTS }, (_, i) => (
          <i key={i} />
        ))}
      </div>
      <div className="pv-block">
        <span className="badge">BALANCE EMPTY</span>
        <p className="badge-note">
          Playback stops / drops to a 30s preview. No free tier — top up to keep listening.
        </p>
      </div>
    </>
  );
}

export function EarningsVisual() {
  return (
    <>
      <div className="pv-head eyebrow">REKAH&apos;S BALANCE</div>
      <div className="row">
        <span className="k">Earned today</span>
        <span className="v">0.088000</span>
      </div>
      <div className="row">
        <span className="k">All-time</span>
        <span className="v">0.412000</span>
      </div>
      <div className="total">
        <span className="k">READY TO WITHDRAW</span>
        <span className="v">0.500000</span>
      </div>
      <div className="pv-block">
        <span className="btn mock" aria-hidden="true">
          WITHDRAW
        </span>
      </div>
    </>
  );
}

const TRUST_ROWS = [
  { song: "Evening Static", raw: "1,204", score: 0.94 },
  { song: "Streetlight", raw: "980", score: 0.81 },
  { song: "Yesterday's Rain", raw: "4,812", score: 0.12 },
];

export function TrustVisual() {
  return (
    <>
      <div className="pv-head eyebrow">WEIGHTED CHART</div>
      {TRUST_ROWS.map((r) => (
        <div className="trust-row" key={r.song}>
          <div className="meter-cap tight">
            <span className="k">{r.song}</span>
            <span className="v">{r.raw} plays</span>
          </div>
          <div className={r.score < 0.5 ? "score low" : "score"}>
            <i style={{ width: `${r.score * 100}%` }} />
          </div>
          <div className="trust-score">
            trust score {r.score.toFixed(2)}
          </div>
        </div>
      ))}
    </>
  );
}
