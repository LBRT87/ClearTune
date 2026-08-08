/* Visual pendamping tiap blok fitur di babak Product.
   Ilustrasi produk, bukan data hidup — angkanya seed dan tidak dibaca dari
   mana pun. Karena itu tidak ada satu pun kontrol di sini yang bisa diklik:
   tombol TARIK sengaja dirender sebagai `.mock` (tanpa hard shadow) supaya
   aturan restraint 03 tetap berlaku — hard shadow hanya di benda yang
   benar-benar bisa ditekan.

   Microcopy "MODE GRATIS AKTIF" + catatannya berasal dari deck A (tiket 04,
   `micro.capBadge` / `micro.capNote`). */

const CAP_SLOTS = 40;

export function CapVisual() {
  return (
    <>
      <div className="meter-cap">
        <span className="k">Play bulan ini</span>
        <span className="v">1.000 / 1.000</span>
      </div>
      <div className="bar">
        {Array.from({ length: CAP_SLOTS }, (_, i) => (
          <i key={i} className="on" />
        ))}
      </div>
      <div className="pv-block">
        <span className="badge">MODE GRATIS AKTIF</span>
        <p className="badge-note">
          Cap habis. Lagu tetap jalan, musisi dibayar dari kas platform.
        </p>
      </div>
      <div className="pv-block">
        <div className="row">
          <span className="k">Auto-refill</span>
          <span className="v">MATI</span>
        </div>
      </div>
    </>
  );
}

export function EarningsVisual() {
  return (
    <>
      <div className="pv-head eyebrow">SALDO REKAH</div>
      <div className="row">
        <span className="k">Dari subscription pendengar</span>
        <span className="v">0,412000</span>
      </div>
      <div className="row">
        <span className="k">Dari kas platform</span>
        <span className="v">0,088000</span>
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
