# ClearTune — Materi Presentasi

Monad Blitz Jakarta, 8 Agustus 2026. Dibuat dari `project-spec.md` (versi final, pay-as-you-go) dan status implementasi aktual per commit `8b726a7`.

---

## 1. Satu kalimat

**ClearTune membagi royalti musik ke musisi per play, real-time, on-chain — bukan direkap enam bulan sekali.**

Pendengar top-up saldo di muka (mirip token listrik). Tiap kali lagu diputar, saldo terpotong nominal kecil dan langsung terbagi ke pemilik hak lewat smart contract. Lapisan AI di belakang layar menyaring stream farming supaya peringkat chart tidak bisa dibeli — tapi lapisan itu tidak pernah menyentuh jalur pembayaran.

---

## 2. Masalah

Royalti streaming musik direkap dan dicairkan **tiap enam bulan**. Selama itu:
- Lagunya sudah bekerja (diputar, menghasilkan), tapi uangnya diam di tangan platform/label.
- Rincian potongan tidak dibuka — musisi tidak tahu persis kenapa angkanya segitu.
- Split sheet (siapa dapat berapa persen) cuma hidup di email/kontrak kertas, tidak bisa diverifikasi independen.
- Sampai uangnya cair, tidak ada cara memastikan hitungannya benar.

## 3. Solusi

Setiap play memicu satu transaksi on-chain yang langsung membagi uang ke semua pemilik hak, saat itu juga:

```
Pendengar top-up saldo (mis. Rp50.000 ≈ mUSD)
        │
        ▼
   balance[listener] di smart contract
        │
   ┌────┴────────────────────┐
   │                          │
saldo cukup              saldo < ratePerPlay
   │                          │
potong ratePerPlay        STOP: playback berhenti /
dari balance[listener]    turun ke preview 30 detik.
   │                       TIDAK PERNAH GRATIS —
   ▼                       user wajib top-up lagi.
royalty router (on-chain)
   │
   ├── 92% → payees (sesuai split sheet, basis points)
   └── 8%  → treasury (fee platform)
```

Tidak ada mode gratis dalam bentuk apa pun. Play yang tidak terdanai **tidak diselesaikan on-chain** — bukan dicatat lalu ditombok platform. Ini keputusan desain sadar: model versi awal sempat pakai subscription+cap+treasury-subsidy, tapi dipivot ke pay-as-you-go murni karena lebih sederhana dan platform tidak pernah menanggung risiko rugi struktural.

---

## 4. USP — kenapa ini beda dan kenapa sulit ditiru

1. **Settlement granular yang secara matematis cuma masuk akal di Monad.** Satu play bernilai kecil (setara puluhan rupiah). Di chain dengan gas normal, biaya settlement melampaui nilai yang dibagi — model ini mustahil dijalankan. Blok Monad yang sub-detik memungkinkan batch settlement ratusan kali lebih sering dibanding chain dengan blok 12 detik, dengan gas tetap murah.
2. **Uang dan reputasi (chart) berjalan di dua jalur yang benar-benar terpisah.** Trust layer AI tidak pernah punya kuasa memblokir pembayaran — ia cuma menulis skor yang dipakai untuk bobot chart. Artinya sistem anti-fraud bisa seagresif mungkin tanpa risiko menahan uang musisi yang sah.
3. **Split sheet permanen dan on-chain**, bukan janji di kontrak kertas. Sekali `registerSong` sukses, `payees`/`bps` tidak bisa diubah — siapapun bisa audit sendiri di block explorer.
4. **Tidak ada token spekulatif.** Gas pakai MON (native), nilai royalti pakai mUSD (stablecoin demo 6 desimal). Musisi butuh kepastian nilai, bukan aset yang harganya naik-turun — argumen ini juga yang membedakan dari kebanyakan proyek "Web3 x musik" yang jualan token.
5. **Model bisnis yang secara struktural tidak bisa rugi.** Tidak ada subsidi play gratis. Treasury cuma menampung fee 8%, itu murni revenue, bukan dana talangan.
6. **Bukan cuma konsep — sudah live dan terverifikasi di Monad testnet** (lihat bagian 9). Ini bedanya dengan sekadar slide.

### Revenue jangka panjang (bukan untuk didemokan)
Fee settlement per play bukan revenue inti jangka panjang (margin bisnis streaming secara struktural tertekan). Revenue inti direncanakan dari **trust layer sebagai produk terpisah** — API deteksi stream farming yang bisa dijual ke platform streaming lain, termasuk yang tidak pakai blockchain sama sekali.

---

## 5. Flow produk (user journey)

### Sisi pendengar
1. Connect wallet (RainbowKit) → lihat katalog lagu.
2. Klaim mUSD dari `faucet()` (demo) → `topUp()` saldo ke kontrak.
3. Putar lagu. Tiap play memotong `ratePerPlay` dari saldo, langsung terbagi ke musisi.
4. Saldo mendekati habis → warning. Saldo habis → playback berhenti / turun ke preview 30 detik, tombol top-up langsung muncul. **Tidak ada fallback gratis.**
5. Panel dukungan menampilkan framing positif: "Bulan ini kamu mendukung 23 musisi, terbanyak Hindia Rp 8.400" — bukan meteran yang menyusut.
6. Tiap play bisa ditelusuri ke transaksi on-chain-nya (link ke block explorer).

### Sisi musisi
1. Upload audio, daftarkan lagu + split sheet (payees + bps, total wajib 10000, validasi duplikat/fingerprint di kontrak).
2. Dashboard real-time: saldo bisa ditarik, total sepanjang masa, pendapatan hari ini, rincian per lagu (play count, rata-rata per play, rasio penyelesaian).
3. Tarik kapan saja — pull pattern, tanpa minimum, tanpa jadwal.

### Trust layer (jalan di belakang layar, tidak pernah dilihat pendengar/musisi secara langsung)
1. Tiap play yang tercatat dianalisis: entropi artis yang didengar, variasi jeda antar play, rasio skip, umur dompet → skor kepercayaan 0–1.
2. Graf pendanaan dompet-ke-dompet di-scan (BFS 2 hop) untuk mendeteksi wash trading (satu dompet mendanai banyak dompet lain buat menggembungkan play count satu lagu).
3. Chart dihitung dari `Σ (trust_score × log(1 + play))`, bukan play mentah — insentif farming langsung berkurang karena playnya makin banyak makin kecil marginal value-nya kalau trust score rendah.
4. Skor ini **cuma memengaruhi ranking chart**, tidak pernah dipakai untuk memutuskan apakah pembayaran diproses.

---

## 6. Tech stack

| Lapisan | Pilihan | Kenapa |
|---|---|---|
| Chain | **Monad testnet** (chain id `10143`) | Sub-second block time + throughput tinggi = satu-satunya cara model settlement granular ini masuk akal secara ekonomi |
| Bahasa kontrak | Solidity `^0.8.24` | Overflow-checked by default, kompatibel penuh dengan Monad EVM |
| Tooling kontrak | **Foundry** (forge, cast, anvil) + `forge-std` | Testing cepat, deploy script reproducible, native ke Monad Foundry fork |
| Frontend | **Next.js 14** (App Router) | Satu repo buat frontend + API routes + trust layer — satu deployment, satu titik gagal, tanpa masalah CORS |
| Styling | Tailwind + custom pixel design system (`component-reference.html`) | Konsisten lintas halaman |
| Wallet | **wagmi + viem + RainbowKit** | Standar de-facto EVM wallet connection di React |
| Database | **Supabase Postgres** | Row Level Security bawaan, cukup buat skala demo, tanpa perlu infra terpisah |
| File audio & cover | **Supabase Storage** (+ cadangan lokal di `public/`) | Upload langsung dari klien |
| Trust layer | **TypeScript**, di dalam API routes Next.js | Heuristik tulisan tangan (bukan model ML berat) — Shannon entropy, koefisien variasi, z-score, BFS deteksi siklus graf |
| Grafik dashboard | **Recharts** | Chart pendapatan/tren dengar |
| Visualisasi graf pendanaan | **react-force-graph-2d** | Panel serangan demo — visual satu dompet mendanai ratusan dompet lain |
| Hosting (rencana) | **Vercel** | Native buat Next.js, zero-config |
| RPC | RPC publik Monad testnet | `https://testnet-rpc.monad.xyz` |

### Yang sengaja **tidak** dipakai
Hardhat (pakai Foundry), backend Python terpisah (trust layer cukup di TypeScript), IPFS untuk streaming (terlalu lambat untuk demo), indexer eksternal seperti Ponder/The Graph (write-through langsung ke Postgres dari backend saat kirim tx, tidak butuh infra indexer), token buatan sendiri yang diperdagangkan (pakai mUSD, bukan aset spekulatif).

---

## 7. Standar & konsep on-chain

### ERC / EIP yang dipakai
- **ERC-20** — `MockUSD` (mUSD), token custom 6 desimal dengan fungsi `faucet()` terbuka untuk demo. Implementasi minimal ditulis sendiri (bukan import OpenZeppelin) supaya total bytecode kecil dan mudah diaudit langsung saat presentasi.
- **EIP-1559** — gas pricing Monad testnet mengikuti model ini (base fee + priority fee); tidak butuh penanganan khusus di kontrak, relevan di sisi deploy/tooling.

### ERC/EIP yang sengaja **tidak** dipakai
- Tidak ada token ERC-20 yang diperdagangkan sebagai aset spekulatif milik platform sendiri.
- Tidak pakai EIP-7702 (account abstraction/delegasi) — tidak ada kebutuhan sponsor gas atau smart wallet di scope demo ini.
- Tidak pakai ERC-721/1155 — lagu bukan NFT, kepemilikan hak diwakili langsung lewat pasangan `payees[]`/`bps[]` di struct `Song`, bukan token terpisah.

### Konsep desain kontrak
- **Pull-payment pattern** — musisi *menarik* saldo (`withdraw()`), kontrak tidak pernah mendorong dana keluar sendiri. Standar keamanan Solidity untuk menghindari serangan lewat fallback function penerima.
- **Checks-effects-interactions** — saldo di-nol-kan dulu sebelum `transfer()` dipanggil, supaya tidak ada celah reentrancy.
- **Skip-not-revert pada batch** — kalau satu listener dalam batch `reportPlays` saldonya kurang, cuma play itu yang di-skip (emit `PlaySkippedLowBalance`), play lain di batch yang sama tetap settle. Ini eksplisit ditegakkan di kontrak, bukan cuma di UI.
- **Split permanen** — setelah `registerSong` sukses, tidak ada fungsi update untuk `payees`/`bps`. Kalau mau ganti, harus registrasi ulang (fingerprint baru).
- **Dust-to-last-payee** — sisa pembagian akibat pembulatan integer dilempar ke payee terakhir di array, supaya total yang terbagi selalu pas, tidak ada mUSD yang "hilang" di kontrak.
- **Parameter bisa diubah owner tanpa redeploy** — `ratePerPlay`, `platformFeeBps`, `minTopUp` semua dibaca lewat `getConfig()`, bukan hardcoded di frontend.
- **On-chain vs off-chain split tanggung jawab** — kontrak cuma nyimpen `payees` (address) dan `bps` (persentase); nama/role kredit ("Artis", "Produser", dst) disimpan off-chain di Postgres (`song_credits`), dipetakan lewat index array yang sama. Ini menghemat gas tanpa mengorbankan kejelasan tampilan.

---

## 8. Jawaban siap pakai untuk pertanyaan juri

**"Bagaimana kontrak tahu lagunya beneran diputar?"**
Setiap play memotong saldo pendengar sendiri secara langsung — tidak ada insentif memalsukan play untuk "mencuri" uang platform, karena yang terpotong ya uang si pendengar. Insentif curang yang tersisa adalah wash streaming (mendanai banyak dompet untuk naikkan posisi chart), makanya trust layer fokus di deteksi graf pendanaan dan pola perilaku dompet, bukan validasi keaslian tiap play secara individual.

**"Apa orang mau bayar per lagu?"**
Mereka tidak bayar manual tiap lagu satu-satu. Mereka top-up saldo di muka (mis. Rp50.000 ≈ 2.500 play), lalu saldo otomatis kepotong kecil-kecil tiap kali dengar — mirip token listrik. Yang per-play adalah cara uangnya dibagi ke musisi, bukan cara user membayar.

**"Platform bisa rugi/nombok?"**
Tidak. Model ini sengaja dibuat tanpa subsidi: kalau saldo pendengar habis, play berhenti atau turun ke preview, bukan diteruskan gratis dari kas platform. Treasury cuma menampung fee 8%, jadi tidak ada risiko treasury minus akibat menanggung pendengar berat.

**"Kenapa harus Monad?"**
Nilai per play kecil; di chain dengan gas normal biaya settlement melebihi nilai yang dibagi. Blok sub-detik Monad memungkinkan batch settlement granular ini terjadi jauh lebih sering dan tetap murah.

**"Kalian tidak punya katalog musik besar."**
Betul, cold start problem. Strategi masuk lewat komunitas musik indie yang tidak dilayani sistem lama, bukan bersaing head-to-head dengan Spotify soal katalog.

**"Kenapa tidak bikin token sendiri?"**
Musisi butuh kepastian nilai, bukan aset spekulatif. Gas pakai MON, nilai royalti dan saldo pakai mUSD (stabil).

---

## 9. Bukti — sudah live, bukan cuma konsep

| Item | Nilai |
|---|---|
| Kontrak `ClearTune` | [`0x110510745346A154f8Bc55c6825A34D0c29d49e8`](https://testnet.monadvision.com/address/0x110510745346A154f8Bc55c6825A34D0c29d49e8) — terverifikasi (`exact_match`) |
| Token `MockUSD` | [`0x3F520E08A7227f8672b593B42A3B25f1806C2f41`](https://testnet.monadvision.com/address/0x3F520E08A7227f8672b593B42A3B25f1806C2f41) — terverifikasi (`exact_match`) |
| Jaringan | Monad Testnet, chain id `10143` |
| Test suite kontrak | 17/17 pass (`forge test`) — registrasi lagu, validasi bps/payee, top-up, play saldo cukup/kurang, batch skip-not-revert, withdraw, withdrawTreasury |
| Uji manual on-chain | Sudah dijalankan langsung lewat `cast` terhadap kontrak live: top-up → play (saldo cukup, settle benar) → play (saldo kosong, di-skip tanpa revert) → batch campuran → withdraw → withdrawTreasury — semua angka cocok perhitungan manual |
| Parameter default | `ratePerPlay = 0.02 mUSD`, `platformFeeBps = 800` (8%), `minTopUp = 50 mUSD` |

---

## 10. Status implementasi saat ini (jujur, buat internal tim)

- ✅ **Kontrak inti** — selesai, dites, live & verified di testnet.
- ✅ **Skema database** (Supabase Postgres) — selesai, sudah disesuaikan ke model pay-as-you-go (`song_credits`, `plays.status` enum `paid`/`skipped_low_balance`).
- ✅ **Landing page** (`/`) — selesai, sudah disesuaikan ke model baru, teruji render.
- 🟡 **Dashboard musisi, player, panel admin** — ada, tapi sebagian masih memanggil ABI/kolom lama (`subscribe`, `playCap`, `funded_by`) dari versi kontrak sebelumnya. Sedang di-migrasi ke ABI baru (`topUp`, `balance`, `status`).
- ⏳ **Deploy ke Vercel** — belum, masih jalan lokal.

Prioritas sisa waktu: selesaikan migrasi ABI di frontend (poin 🟡), baru deploy publik.
