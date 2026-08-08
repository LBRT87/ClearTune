import "./landing.css";

import { Footer } from "@/components/landing/Footer";
import { LiveCursors } from "@/components/landing/LiveCursors";
import { Marquee } from "@/components/landing/Marquee";
import { PixelIcon } from "@/components/landing/PixelIcon";
import {
  CapVisual,
  EarningsVisual,
  TrustVisual,
} from "@/components/landing/ProductVisuals";
import { SettlementWidget } from "@/components/landing/SettlementWidget";
import { PLATFORM_FEE_BPS, RATE_PER_PLAY, SETTLEMENT, fmt } from "@/lib/settlement";

const TL_SLOTS = 48;

function Timeline({ variant }: { variant: "lama" | "baru" }) {
  return (
    <div className="tl">
      {Array.from({ length: TL_SLOTS }, (_, i) => (
        <i
          key={i}
          className={variant === "baru" || i === TL_SLOTS - 1 ? "on" : undefined}
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
          <a className="btn btn-purple" href="/home">
            BUKA APP
          </a>
        </div>
      </nav>

      <main>
        <div className="shell hero">
          <div className="eyebrow" style={{ marginBottom: "var(--s3)" }}>
            ROYALTI MUSIK ON-CHAIN &middot; MONAD
          </div>
          <h1>
            BUKAN 6 BULAN SEKALI.
            <br />
            <em>TIAP PLAY.</em>
          </h1>
          <p className="lede">
            Sekali lagu diputar, uangnya terbagi ke semua pemilik hak saat itu juga.
            Bukan direkap, bukan dijanjikan.
          </p>
          <div className="cta">
            <a className="btn" href="/home">
              DENGAR SEKARANG
            </a>
            <a className="btn btn-ghost" href="/register">
              SAYA MUSISI
            </a>
          </div>

          <SettlementWidget />
        </div>

        <Marquee />

        <section className="act shell" id="masalah" aria-labelledby="h-masalah">
          <div className="eyebrow" style={{ marginBottom: "var(--s3)" }}>
            MASALAHNYA
          </div>

          <div className="split">
            <h2 className="act-head" id="h-masalah">
              DIBAYAR TERAKHIR.
              <br />
              SELALU.
            </h2>
            <p className="lede">
              Royalti direkap tiap enam bulan. Selama itu lagunya bekerja, tapi uangnya
              diam di tangan orang lain. Rinciannya tidak dibuka, potongannya tidak
              dijelaskan, dan sampai uangnya cair tidak ada satu pun cara memastikan
              hitungannya benar.
            </p>
          </div>

          <div className="cmp-grid">
            <div className="cmp bad">
              <div className="cmp-hd">
                <PixelIcon name="lock" />
                <span className="lbl">CARA LAMA</span>
              </div>
              <Timeline variant="lama" />
              <div className="tl-cap">
                <span className="k">Selama 6 bulan, tidak ada apa-apa.</span>
                <span className="v">1&times;</span>
              </div>
              <div className="li">Rekap 6 bulan sekali</div>
              <div className="li">Rincian tertutup</div>
              <div className="li">Potongan tidak dijelaskan</div>
              <div className="li">Split sheet cuma di email</div>
            </div>

            <div className="cmp good">
              <div className="cmp-hd">
                <PixelIcon name="split" />
                <span className="lbl">DI SINI</span>
              </div>
              <Timeline variant="baru" />
              <div className="tl-cap">
                <span className="k">Tiap play, langsung terbagi.</span>
                <span className="v">48&times;</span>
              </div>
              <div className="li">Terbagi tiap play</div>
              <div className="li">Tiap play punya tx hash</div>
              <div className="li">Fee 8%, tertulis di kontrak</div>
              <div className="li">Split permanen on-chain</div>
            </div>
          </div>
        </section>

        <section className="act shell" id="cara-kerja" aria-labelledby="h-produk">
          <div className="eyebrow" style={{ marginBottom: "var(--s3)" }}>
            CARA KERJANYA
          </div>
          <div className="split">
            <h2 className="act-head" id="h-produk">
              TIGA SISI.
              <br />
              SATU ALIRAN.
            </h2>
            <p className="lede">
              Pendengar top-up saldo. Musisi dibayar tiap play. Trust layer menjaga
              chart-nya tetap jujur.
            </p>
          </div>

          <div className="pblock">
            <div className="pb-text">
              <div className="eyebrow">
                <i>01</i> SISI PENDENGAR
              </div>
              <h3 className="pb-title">
                ISI SALDO.
                <br />
                <em>DENGAR TERUS.</em>
              </h3>
              <p className="lede">
                Top-up saldo di muka, mirip token listrik. Tiap play memotong saldo
                dengan nominal tetap dan langsung terbagi ke musisi. Saldo habis, dengarnya
                berhenti sampai top-up lagi — tidak ada mode gratis.
              </p>
            </div>
            <div className="pb-visual">
              <CapVisual />
            </div>
          </div>

          <div className="pblock flip">
            <div className="pb-text">
              <div className="eyebrow">
                <i>02</i> SISI MUSISI
              </div>
              <h3 className="pb-title">
                UANGNYA SUDAH
                <br />
                <em>DI SANA.</em>
              </h3>
              <p className="lede">
                Saldo bertambah tiap play, bukan tiap kuartal. Tarik kapan saja, tanpa
                minimum, tanpa jadwal. Split sheet ditulis sekali saat registrasi dan
                tidak bisa diubah setelahnya.
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
                PLAY PALSU
                <br />
                <em>TIDAK IKUT NAIK.</em>
              </h3>
              <p className="lede">
                Chart dihitung dari play berbobot trust score, bukan play mentah. Dompet
                yang memutar satu lagu terus-menerus tetap dibayar, tapi bobotnya turun.
                Pembayaran dan peringkat jalan di jalur terpisah.
              </p>
            </div>
            <div className="pb-visual">
              <TrustVisual />
            </div>
          </div>
        </section>

        <section className="act shell" id="bukti" aria-labelledby="h-bukti">
          <div className="eyebrow" style={{ marginBottom: "var(--s3)" }}>
            BUKTINYA
          </div>
          <div className="split">
            <h2 className="act-head" id="h-bukti">
              SATU PLAY.
              <br />
              SATU STRUK.
            </h2>
            <p className="lede">
              Tiap play menulis satu transaksi: siapa yang membayar, siapa yang menerima,
              berapa bagian masing-masing. Tidak ada baris yang disembunyikan sampai akhir
              kuartal.
            </p>
          </div>

          <div className="close">
            <div className="close-hd">
              <span className="t">STRUK SETTLEMENT</span>
              <span className="b">contoh satu play</span>
            </div>

            <div className="close-body">
              <div className="rc">
                <span className="k">Tx</span>
                <span className="data pending">menunggu play pertama di produksi</span>
              </div>
              <div className="rc">
                <span className="k">Jaringan</span>
                <span className="data">Monad Testnet</span>
              </div>
              <div className="rc">
                <span className="k">Didanai</span>
                <span className="data">saldo pendengar</span>
              </div>

              <div className="ledger">
                <div className="eyebrow">MASUK</div>
                <div className="row">
                  <span className="k">Tarif per play</span>
                  <span className="v">{fmt(RATE_PER_PLAY)} mUSD</span>
                </div>
              </div>

              <div className="ledger">
                <div className="eyebrow">KELUAR</div>
                <div className="row">
                  <span className="k">
                    Fee platform <span className="bps">{PLATFORM_FEE_BPS} bps</span>
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
                <span className="k">TERBAGI</span>
                <span className="v">{fmt(RATE_PER_PLAY)}</span>
              </div>

              <div className="check">
                <div className="eyebrow">HITUNG ULANG</div>
                <div className="check-line">
                  {RATE_PER_PLAY} &minus; {fee} = {net}
                </div>
                <div className="check-line">
                  {net} = {shares.map((p) => p.amount).join(" + ")}
                </div>
              </div>

              <p className="honesty">
                Angka di halaman ini dihitung dari parameter kontrak yang sama dengan yang
                live di Monad testnet, bukan angka karangan.
              </p>
            </div>
          </div>

          <div className="close-cta">
            <a className="btn btn-purple" href="/home">
              DENGAR SEKARANG
            </a>
            <a className="btn btn-ghost" href="/register">
              DAFTARKAN LAGU
            </a>
          </div>
        </section>
      </main>

      <Footer />

      <LiveCursors />
    </>
  );
}
