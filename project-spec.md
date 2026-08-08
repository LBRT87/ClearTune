# Project Spec — Platform Royalti Musik On-Chain

Dokumen ini adalah brief kerja untuk AI coding agent. Semua keputusan di sini sudah final hasil diskusi tim — jangan diubah tanpa instruksi eksplisit dari pengguna.

Target: Monad Blitz Jakarta, 8 Agustus 2026. Hacking 11:30–17:30 WIB, code freeze 17:30, submission 17:45.

---

## 1. Ringkasan produk

Platform streaming musik di mana royalti dibagi ke musisi **per play, real-time, on-chain**. Pendengar bayar subscription bulanan dengan cap jumlah play; setelah cap habis, pendengar tetap bisa dengar gratis (musisi tetap dibayar dari kas platform), atau pendengar bisa aktifkan auto-refill untuk lanjut bayar. Lapisan AI menyaring stream farming supaya peringkat chart tidak bisa dimanipulasi.

Uang dan peringkat chart mengalir di jalur terpisah: pembayaran tidak pernah diblokir, hanya bobot chart yang disaring.

---

## 2. Model bisnis final

### 2.1 Alur uang

```
Pendengar bayar subscription (mUSD)
        │
        ▼
   Masuk sebagai kuota play bulanan (cap)
        │
   ┌────┴─────────────────────────┐
   │                               │
di bawah cap                  cap habis
   │                               │
dipotong dari                 default: GRATIS (unmetered)
subscription pendengar        musisi tetap dibayar dari
   │                          KAS PLATFORM (treasury)
   │                               │
   ▼                          user bisa pilih:
royalty router                AUTO-REFILL (opt-in eksplisit,
   │                          bukan default) → kembali ke
   ▼                          mode dipotong dari user
pemilik hak (payees)
```

### 2.2 Aturan yang tidak boleh dilanggar

- **Tidak ada penarikan saldo diam-diam.** Begitu cap tersentuh, UI harus menampilkan state yang jelas sebelum masuk mode gratis atau auto-refill.
- **Auto-refill adalah opt-in, bukan default.** User harus klik konfirmasi eksplisit untuk mengaktifkan.
- **Musisi selalu dibayar**, baik play itu didanai pendengar (di bawah cap) maupun didanai treasury (di atas cap, mode gratis). Tidak pernah ada play valid yang tidak menghasilkan royalti.
- **Pembayaran dan chart adalah dua jalur terpisah.** Trust layer tidak pernah memblokir pembayaran — hanya mempengaruhi bobot peringkat chart.
- **Semua parameter bisa diubah owner** (cap, tarif per play, fee %) — tidak hardcoded, supaya bisa disesuaikan tanpa redeploy.

### 2.3 Pembagian pendapatan

| Komponen | Persentase |
|---|---|
| Fee platform | 8% dari tiap play |
| Sisa dibagi ke payees | 92%, sesuai basis points split sheet lagu |

Fee platform masuk ke treasury, yang juga menjadi sumber dana untuk menomboki play gratis setelah cap.

### 2.4 Token

- **Gas:** MON native (wajib, konsekuensi deploy di Monad testnet)
- **Nilai royalti & subscription:** `MockUSD` (mUSD) — ERC-20 6 desimal buatan sendiri untuk demo, bukan token yang dijual/diperdagangkan. Ada fungsi `faucet()` untuk isi ulang saat demo.
- **Tidak membuat token spekulatif sendiri.** Alasan ke juri: musisi butuh kepastian nilai, bukan aset yang harganya naik-turun.

### 2.5 Kenapa harus di Monad (jawaban siap pakai)

Satu play bernilai kecil (setara puluhan rupiah). Di chain dengan gas normal, biaya settlement melampaui nilai yang dibagi — model ini secara matematis mustahil. Blok Monad yang sub-detik memungkinkan batch settlement ratusan kali lebih sering dibanding chain dengan blok 12 detik.

### 2.6 Revenue jangka panjang (bukan untuk didemokan, untuk dijawab kalau ditanya juri)

Subscription/fee settlement bukan revenue utama jangka panjang (margin bisnis streaming secara struktural tertekan). Revenue inti direncanakan dari **trust layer sebagai produk terpisah** — API deteksi stream farming yang bisa dijual ke platform streaming lain, termasuk yang tidak pakai blockchain.

---

## 3. Tech stack

### 3.1 Keputusan arsitektur utama

**Satu repo Next.js untuk semuanya** — frontend, API routes, dan trust layer. Tidak ada backend Python terpisah. Alasan: satu deployment, satu titik gagal, tidak ada masalah CORS antar layanan.

### 3.2 Daftar lengkap

| Lapisan | Pilihan |
|---|---|
| Chain | Monad testnet |
| Bahasa kontrak | Solidity 0.8.24+ |
| Tooling kontrak | Foundry |
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind |
| Wallet | wagmi + viem + RainbowKit |
| Database | Supabase Postgres |
| File audio | Supabase Storage (+ cadangan lokal di `public/`) |
| Hosting | Vercel |
| RPC | RPC publik Monad |
| Trust layer | TypeScript, di dalam API routes Next.js |
| Grafik dashboard | Recharts |
| Visualisasi graf pendanaan | react-force-graph |
| History/indexing | Write-through ke Postgres (backend menulis saat mengirim tx, bukan indexer eksternal) |

### 3.3 Library trust layer

Ditulis manual di TypeScript, bukan model ML berat:

- Entropi Shannon (keragaman artis yang didengar)
- Koefisien variasi jeda antar play
- Z-score / normalisasi fitur
- Deteksi siklus di graf pendanaan (BFS 2 hop)

Opsional kalau ada waktu lebih: `isolation-forest` (npm) untuk scoring anomali berbasis model, atau model dilatih di Python lalu di-export ke ONNX dan dijalankan via `onnxruntime-node`.

### 3.4 Yang sengaja tidak dipakai

Hardhat, backend Python terpisah, IPFS untuk streaming (terlalu lambat untuk demo), indexer eksternal (Ponder/The Graph — bagus tapi butuh setup lebih lama dari yang perlu), token buatan sendiri yang diperdagangkan.

---

## 4. Model data

### 4.1 Kontrak (state utama)

```solidity
struct Song {
    bytes32 fingerprint;      // sidik jari audio, cek duplikat
    bytes32 contentHash;      // hash file, cek keaslian
    string  uri;               // lokasi file (Supabase Storage)
    address[] payees;
    uint16[]  bps;              // basis points, total harus 10000
    address registrar;
}

mapping(uint256 => Song)     public songs;
mapping(bytes32 => bool)     public fingerprintUsed;

mapping(address => uint256)  public playsThisMonth;   // untuk cek cap
mapping(address => bool)     public autoRefillEnabled;
mapping(address => uint256)  public subBalance;        // saldo subscription aktif

mapping(address => uint256)  public earned;             // akrual pemilik hak, pull pattern
uint256 public treasury;                                 // kas platform, sumber nombok

uint256 public playCap = 1000;          // parameter, bisa diubah owner
uint256 public ratePerPlay = 1000;      // dalam satuan terkecil mUSD, parameter
uint16  public platformFeeBps = 800;    // 8%, parameter
```

Fungsi inti: `registerSong`, `subscribe` (top up subBalance), `reportPlays` (batch, dipanggil backend), `toggleAutoRefill`, `withdraw`.

### 4.2 Logika `reportPlays` (ringkas, per play)

```
jika playsThisMonth[listener] < playCap:
    potong dari subBalance[listener]
    playsThisMonth++
    settle ke payees (fee 8% ke treasury, sisanya ke payees)
jika lewat cap DAN autoRefillEnabled[listener] DAN subBalance cukup:
    treat seperti di bawah cap (top up otomatis sudah terjadi sebelumnya)
jika lewat cap DAN TIDAK autoRefillEnabled:
    play tetap dicatat valid (untuk trust layer)
    settle ke payees, tapi dana diambil dari treasury, bukan subBalance
    tidak ada potongan ke listener
```

### 4.3 Postgres

```
songs          (id, song_id_onchain, title, artist, duration, storage_url, created_at)
plays          (id, wallet, song_id, played_at, duration_played, completed,
                 funded_by ENUM('subscription','treasury'), tx_hash, status)
wallet_stats   (wallet, entropy, cv_gap, skip_ratio, first_seen, funder, trust_score)
chart_cache    (song_id, period, weighted_score, rank, updated_at)
treasury_log   (id, event_type, amount, balance_after, created_at)
```

Kolom `funded_by` penting — ini yang memisahkan pendapatan musisi dari subscription vs dari treasury di dashboard.

---

## 5. Breakdown fitur

### 5.1 Sisi pendengar

| Fitur | Detail |
|---|---|
| Player + katalog | Putar, antrean, riwayat dengar |
| Status cap | Tampilan jelas: "Sisa 340 dari 1.000 play bulan ini", berubah jadi badge "Mode gratis aktif" begitu cap tersentuh |
| Toggle auto-refill | Off secara default. Aktifkan lewat konfirmasi eksplisit, bukan diam-diam |
| Panel dukungan | "Bulan ini kamu mendukung 23 musisi, terbanyak Hindia Rp 8.400" — framing positif, bukan meteran yang menyusut |
| Bukti transaksi | Tiap play, link ke block explorer |

### 5.2 Sisi musisi

| Fitur | Detail |
|---|---|
| Registrasi lagu + split sheet | Upload audio, tentukan payees dan bps, validasi total 10000, cek fingerprint duplikat |
| Dashboard pendapatan real-time | Saldo bisa ditarik, total sepanjang masa, pendapatan hari ini |
| Rincian sumber pendapatan | Pisahkan kolom "dari subscription pendengar" vs "dari kas platform (play gratis)" |
| Rincian per lagu | Play count, pendapatan, rata-rata per play, rasio penyelesaian |
| Tarik kapan saja | Pull pattern, tanpa minimum, tanpa jadwal |

### 5.3 Trust layer (AI)

| Fitur | Detail |
|---|---|
| Skor kepercayaan dompet | Entropi artis, variasi jeda, rasio skip, umur dompet, sumber dana → skor 0–1 |
| Deteksi graf pendanaan | BFS 2 hop, cari siklus dana pemutar → penerima royalti |
| Chart berbobot | `Σ (trust_score × log(1 + play))`, bukan play mentah |
| Panel serangan (demo) | Visual satu dompet mendanai ratusan dompet lain yang memutar satu lagu sama |
| Perhatian khusus untuk model cap | Play gratis setelah cap adalah target farming yang lebih menarik (tidak ada biaya lagi) — skoring harus tetap ketat, idealnya lebih ketat untuk dompet yang sudah lewat cap |

### 5.4 Admin / platform

| Fitur | Detail |
|---|---|
| Panel kesehatan kas | Total masuk dari fee, total keluar untuk nombok, saldo treasury bersih |
| Parameter kontrak | `playCap`, `ratePerPlay`, `platformFeeBps` — bisa diubah owner tanpa redeploy |

---

## 6. Aturan validasi (harus ditegakkan di kontrak, bukan cuma UI)

- Total `bps` per lagu harus tepat 10000
- Maksimal 10 payees per lagu
- Tidak boleh alamat nol atau duplikat di payees
- Fingerprint harus unik sebelum registrasi diterima
- Split bersifat **permanen** setelah registrasi (tidak ada fungsi update)
- Semua akuntansi uang dalam satuan terkecil (6 desimal mUSD), bukan angka bulat
- Sisa pembagian (dust) dilempar ke payee terakhir di array
- Withdraw pakai pola checks-effects-interactions (nolkan saldo sebelum transfer)

---

## 7. Urutan pengerjaan (prioritas, bukan jadwal jam)

1. **Kontrak inti** — registry lagu, subscription + cap, mode gratis setelah cap, treasury, withdraw. Semua pekerjaan lain menunggu ini.
2. **Deploy ke testnet + uji manual** — top up, play di bawah cap, play setelah cap (pastikan musisi tetap dibayar dari treasury), withdraw.
3. **Dashboard musisi** — saldo, grafik, rincian per lagu, pemisahan sumber dana.
4. **Trust layer + API scoring** — feature extraction, endpoint `/api/trust`. Bisa paralel dengan langkah 3.
5. **Player + status cap di UI pendengar** — termasuk badge mode gratis dan toggle auto-refill. Dikerjakan setelah kontrak fix, karena state-nya bergantung struktur kontrak.
6. **Chart berbobot + panel serangan** — sambungkan trust layer ke tampilan chart, siapkan skenario serangan untuk demo.
7. **Panel kesehatan kas (admin)** — paling akhir, bukan prioritas demo tapi menjawab pertanyaan risiko nombok.
8. **Freeze, seed data demo, rekam video cadangan, latihan pitch.**

Kalau kontrak di langkah 1 molor jauh: buang toggle auto-refill, cukup demo "cap habis → gratis, musisi tetap dibayar dari treasury" tanpa opsi refill. Sebut toggle sebagai roadmap kalau ditanya juri.

---

## 8. Jawaban siap pakai untuk pertanyaan juri

**"Bagaimana kontrak tahu lagunya beneran diputar?"**
Untuk play di bawah cap, yang terpotong adalah saldo pendengar sendiri — tidak ada insentif memalsukan play untuk mencuri uang. Untuk play gratis setelah cap, insentif curang justru naik (karena gratis), jadi trust layer diperketat khusus untuk kondisi ini.

**"Apa orang mau bayar per lagu?"**
Mereka tidak bayar per lagu. Mereka bayar subscription dengan cap, seperti paket data. Yang per lagu adalah cara uangnya dibagi ke musisi.

**"Platform bisa rugi/nombok?"**
Ya, secara sengaja, mirip model unlimited data plan atau asuransi — risiko ditanggung dari fee mayoritas pengguna normal untuk mensubsidi sebagian kecil heavy user. Panel kesehatan kas memantau ini, dan cap/fee adalah parameter yang bisa disesuaikan tanpa redeploy kalau kas menipis.

**"Kenapa harus Monad?"**
Nilai per play kecil; di chain dengan gas normal biaya settlement melebihi nilai yang dibagi. Blok sub-detik Monad memungkinkan batch settlement jauh lebih sering.

**"Kalian tidak punya katalog musik besar."**
Betul, cold start problem. Strategi masuk lewat komunitas musik indie yang tidak dilayani sistem lama, bukan bersaing head-to-head dengan Spotify soal katalog.

**"Kenapa tidak bikin token sendiri?"**
Musisi butuh kepastian nilai, bukan aset spekulatif. Gas pakai MON, nilai royalti pakai mUSD (stabil).

---

## 9. Instruksi kerja untuk AI agent

- Ikuti urutan di bagian 7. Jangan mulai UI player sebelum kontrak di langkah 1–2 selesai dan teruji.
- Semua angka bisnis (cap, tarif, fee) harus jadi parameter kontrak yang bisa dibaca dari `getConfig()` atau setara, bukan hardcoded di frontend.
- Setiap kali menulis event `plays` ke Postgres, isi kolom `funded_by` dengan benar (`subscription` atau `treasury`) — ini dipakai di banyak tempat (dashboard musisi, panel kesehatan kas).
- Trust layer tidak pernah dipanggil untuk memutuskan apakah pembayaran diproses. Ia hanya menulis `trust_score` yang dipakai saat menghitung `chart_cache`.
- Untuk demo: sediakan tombol/endpoint untuk mempercepat simulasi (set cap kecil sementara, generate 500 dompet serangan) — ini fitur developer/demo, boleh ada di UI tersembunyi atau query param, tidak perlu produksi-grade.
- Kalau ragu antara menyelesaikan sesuatu dengan sempurna vs menyelesaikan versi sederhana yang jalan, pilih versi sederhana yang jalan. Prioritas hari ini adalah demo yang hidup, bukan kode yang production-ready.
