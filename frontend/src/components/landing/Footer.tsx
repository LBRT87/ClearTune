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
          <p className="small">Royalti musik dibagi tiap play, on-chain.</p>
        </div>

        <nav className="ft-col" aria-label="Bagian halaman">
          <div className="eyebrow">HALAMAN</div>
          <a href="#masalah">Masalahnya</a>
          <a href="#cara-kerja">Cara kerjanya</a>
          <a href="#bukti">Buktinya</a>
        </nav>

        <div className="ft-col">
          <div className="eyebrow">PARAMETER KONTRAK</div>
          <div className="ft-row">
            <span>Jaringan</span>
            <b>Monad Testnet</b>
          </div>
          <div className="ft-row">
            <span>Tarif per play</span>
            <b>{fmt(RATE_PER_PLAY)}</b>
          </div>
          <div className="ft-row">
            <span>Fee platform</span>
            <b>{PLATFORM_FEE_BPS} bps</b>
          </div>
        </div>
      </div>

      <div className="shell ft-base">
        <span>Prototype Monad Blitz Jakarta &middot; Agustus 2026</span>
        <span className="ft-status">KONTRAK BELUM TER-DEPLOY</span>
      </div>
    </footer>
  );
}
