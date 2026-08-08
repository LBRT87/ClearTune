/* Footer.

   Semua tautan menunjuk ke anchor di halaman ini sendiri. Tidak ada route
   lain yang sudah ada, dan link mati ke `/harga` atau `/docs` adalah cara
   tercepat membuat halaman terasa palsu di depan juri.

   Kolom parameter membaca angka yang sama dengan hero widget dan struk
   penutup lewat `lib/settlement` — kalau tarif kontrak berubah, footer ikut
   berubah, tidak bisa ketinggalan. */

import { PLATFORM_FEE_BPS, RATE_PER_PLAY, fmt } from "@/lib/settlement";

export function Footer() {
  return (
    <footer className="ft">
      <div className="shell ft-grid">
        <div className="ft-brand">
          <span className="brand">
            CLEARTUNE<i>.</i>
          </span>
          <p className="small">Music royalties split on every play, on-chain.</p>
        </div>

        <nav className="ft-col" aria-label="Page sections">
          <div className="eyebrow">PAGE</div>
          <a href="#problem">The problem</a>
          <a href="#how-it-works">How it works</a>
          <a href="#proof">The proof</a>
        </nav>

        <div className="ft-col">
          <div className="eyebrow">CONTRACT PARAMETERS</div>
          <div className="ft-row">
            <span>Network</span>
            <b>Monad Testnet</b>
          </div>
          <div className="ft-row">
            <span>Rate per play</span>
            <b>{fmt(RATE_PER_PLAY)}</b>
          </div>
          <div className="ft-row">
            <span>Platform fee</span>
            <b>{PLATFORM_FEE_BPS} bps</b>
          </div>
        </div>
      </div>

      <div className="shell ft-base">
        <span>Prototype for Monad Blitz Jakarta &middot; August 2026</span>
        <span className="ft-status">LIVE ON MONAD TESTNET</span>
      </div>
    </footer>
  );
}
