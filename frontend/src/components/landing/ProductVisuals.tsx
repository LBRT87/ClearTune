/* Visual pendamping tiap blok fitur di babak Product.
   Ilustrasi produk, bukan data hidup — angkanya seed dan tidak dibaca dari
   mana pun. Karena itu tidak ada satu pun kontrol di sini yang bisa diklik:
   tombol TARIK sengaja dirender sebagai `.mock` (tanpa hard shadow) supaya
   aturan restraint 03 tetap berlaku — hard shadow hanya di benda yang
   benar-benar bisa ditekan.

   Model bisnisnya pay-per-play murni (project-spec.md §2): tidak ada cap,
   tidak ada mode gratis, tidak ada auto-refill. Saldo habis = berhenti,
   titik. */

const BALANCE_SLOTS = 40;

export function BalanceVisual() {
  return (
    <>
      <div className="meter-cap">
        <span className="k">Saldo</span>
        <span className="v">0,000000 mUSD</span>
      </div>
      <div className="bar">
        {Array.from({ length: BALANCE_SLOTS }, (_, i) => (
          <i key={i} />
        ))}
      </div>
      <div className="pv-block">
        <span className="badge">SALDO HABIS</span>
        <p className="badge-note">
          Playback berhenti / turun ke preview 30 detik. Tidak ada mode gratis — top-up lagi
          buat lanjut dengar.
        </p>
      </div>
    </>
  );
}

export function EarningsVisual() {
  return (
    <>
      <div className="pv-head eyebrow">SALDO REKAH</div>
      <div className="row">
        <span className="k">Pendapatan hari ini</span>
        <span className="v">0,088000</span>
      </div>
      <div className="row">
        <span className="k">Sepanjang masa</span>
        <span className="v">0,412000</span>
      </div>
      <div className="total">
        <span className="k">SIAP DITARIK</span>
        <span className="v">0,500000</span>
      </div>
      <div className="pv-block">
        <span className="btn mock" aria-hidden="true">
          TARIK
        </span>
      </div>
    </>
  );
}

const TRUST_ROWS = [
  { song: "Senja di Pasar Minggu", raw: "1.204", score: 0.94 },
  { song: "Lampu Jalan", raw: "980", score: 0.81 },
  { song: "Hujan Kemarin", raw: "4.812", score: 0.12 },
];

export function TrustVisual() {
  return (
    <>
      <div className="pv-head eyebrow">CHART BERBOBOT</div>
      {TRUST_ROWS.map((r) => (
        <div className="trust-row" key={r.song}>
          <div className="meter-cap tight">
            <span className="k">{r.song}</span>
            <span className="v">{r.raw} play</span>
          </div>
          <div className={r.score < 0.5 ? "score low" : "score"}>
            <i style={{ width: `${r.score * 100}%` }} />
          </div>
          <div className="trust-score">
            trust score {r.score.toFixed(2).replace(".", ",")}
          </div>
        </div>
      ))}
    </>
  );
}
