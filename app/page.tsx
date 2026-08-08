/* Landing page ClearTune — route `/`.

   Urutan babak: Proof → Problem → Product → Proof (tiket 02).
   Naskah: deck A "Jeda" (tiket 04) — argumennya KAPAN musisi dibayar, musuhnya
   rekap 6 bulan sekali. Dua deck yang kalah diarsipkan di
   `.scratch/landing-page/04-copy-decks-arsip.ts`.

   Struktur final babak Product & Proof penutup diputuskan di tiket 05. Dua
   keputusannya yang menentukan:

   - Product diberi nomor 01/02/03. Judul babaknya menjanjikan "TIGA SISI";
     tanpa penomoran pembaca tidak pernah tahu sudah sampai sisi ke berapa,
     dan janji itu menguap.
   - Struk penutup TIDAK mengulang tabel hero. Hero memperlihatkan angka
     bergerak; penutup memperlihatkan dokumen diam yang bisa dijumlahkan
     ulang — karena itu ada kolom MASUK/KELUAR dan baris aritmatika di
     bawahnya. Kalau keduanya menampilkan tabel yang sama, babak penutup
     tidak menambah bukti apa pun. */

import { Footer } from "@/components/Footer";
import { LiveCursors } from "@/components/LiveCursors";
import { Marquee } from "@/components/Marquee";
import { PixelIcon } from "@/components/PixelIcon";
import {
  CapVisual,
  EarningsVisual,
  TrustVisual,
} from "@/components/ProductVisuals";
import { SettlementWidget } from "@/components/SettlementWidget";
import { PLATFORM_FEE_BPS, RATE_PER_PLAY, SETTLEMENT, fmt } from "@/lib/settlement";
import Link from "next/link";

/* Tiga CTA memetakan berbeda (tiket auth/05):
     DENGAR SEKARANG → /daftar?role=pendengar
     SAYA MUSISI     → /daftar?role=musisi
     BUKA APP        → /masuk
   `?role=` memilihkan copy di `/daftar` dan kartu di layar pilih peran —
   tidak mengunci apa pun. Tiket 07 yang membuat CTA ini sadar sesi. */
const CTA_DENGAR = "/daftar?role=pendengar";
const CTA_MUSISI = "/daftar?role=musisi";
const CTA_MASUK = "/masuk";

/* Timeline perbandingan: kedua track lebarnya identik, jadi kerapatannya
   yang bicara — 1 pembayaran dalam 6 bulan vs 1 tiap play. */
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
          <Link className="btn btn-purple" href={CTA_MASUK}>
            BUKA APP
          </Link>
        </div>
      </nav>

      <main>
        {/* ══ BABAK 1 — PROOF ══ */}
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
            <Link className="btn" href={CTA_DENGAR}>
              DENGAR SEKARANG
            </Link>
            <Link className="btn btn-ghost" href={CTA_MUSISI}>
              SAYA MUSISI
            </Link>
          </div>

          <SettlementWidget />
        </div>

        <Marquee />

        {/* ══ BABAK 2 — PROBLEM ══ */}
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

        {/* ══ BABAK 3 — PRODUCT ══
            Tiga blok berselang-seling. Nomor 01/02/03 menagih janji
            "TIGA SISI" di judul babak. */}
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
              Pendengar membayar sekali sebulan. Musisi dibayar tiap play. Trust layer
              menjaga chart-nya tetap jujur.
            </p>
          </div>

          <div className="pblock">
            <div className="pb-text">
              <div className="eyebrow">
                <i>01</i> SISI PENDENGAR
              </div>
              <h3 className="pb-title">
                BAYAR SEKALI.
                <br />
                <em>DENGAR TERUS.</em>
              </h3>
              <p className="lede">
                Subscription bulanan datang dengan cap 1.000 play. Lewat cap, lagu tetap
                jalan dan musisi tetap dibayar — dananya dari kas platform, bukan dari
                saldomu. Auto-refill ada, tapi harus kamu nyalakan sendiri.
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

        {/* ══ BABAK 4 — PROOF penutup ══
            Struk sebagai dokumen, bukan tabel kedua. MASUK / KELUAR memisahkan
            uang yang datang dari uang yang pergi, dan baris aritmatika di
            bawahnya mengundang juri menjumlahkan sendiri. Angkanya dirakit dari
            `lib/settlement`, jadi tidak mungkin meleset dari hero. */}
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
              {/* Tx dan nomor block sengaja kosong. Mengisinya dengan hash
                  karangan adalah hal pertama yang akan dicek juri Monad, dan
                  ketahuan memalsukan bukti jauh lebih mahal daripada mengakui
                  kontraknya belum ter-deploy (tiket 07). */}
              <div className="rc">
                <span className="k">Tx</span>
                <span className="data pending">menunggu deploy kontrak</span>
              </div>
              <div className="rc">
                <span className="k">Jaringan</span>
                <span className="data">Monad Testnet</span>
              </div>
              <div className="rc">
                <span className="k">Didanai</span>
                <span className="data">subscription pendengar</span>
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
                Kontrak belum ter-deploy. Angka di halaman ini dihitung dari parameter
                kontrak di browser, bukan dibaca dari chain.
              </p>
            </div>
          </div>

          <div className="close-cta">
            <Link className="btn btn-purple" href={CTA_DENGAR}>
              DENGAR SEKARANG
            </Link>
            <Link className="btn btn-ghost" href={CTA_MUSISI}>
              DAFTARKAN LAGU
            </Link>
          </div>
        </section>
      </main>

      <Footer />

      {/* Terakhir di dalam body: lapisannya menutupi seluruh dokumen (tiket 06),
          dan z-index 40 menaruhnya di bawah nav (50) — cursor orang lain tidak
          boleh menutupi tombol yang bisa ditekan. */}
      <LiveCursors />
    </>
  );
}
