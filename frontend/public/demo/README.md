# Track demo

Taruh **satu** file audio di folder ini dengan nama:

```
senja-di-pasar-minggu.mp3
```

Kalau nama atau ekstensinya beda, ubah `TRACK.src` di [`lib/track.ts`](../../lib/track.ts) —
itu satu-satunya tempat path ini ditulis.

## Yang perlu diperhatikan

- **Durasi ideal 30–60 detik.** Satu playthrough = satu play. Track 4 menit
  berarti ticker-nya cuma bergerak sekali tiap 4 menit — mati di atas panggung.
- **Satu play dihitung setelah 10 detik terdengar** (`PLAY_THRESHOLD_S` di
  `lib/track.ts`), dibatasi separuh durasi track. Angkanya ditulis apa adanya di
  panel settlement, jadi jangan diubah tanpa mengecek kalimatnya masih benar.
- **Lisensi.** Kalau tracknya CC-BY, atribusinya wajib muncul di halaman —
  tambahkan di footer. Kalau CC0/domain publik atau bikinan sendiri, tidak perlu.
- **Ukuran file.** Ini di-serve dari `public/`, bukan CDN. Di bawah 2 MB.

## Kalau filenya belum ada

Halaman tetap jalan. Tombol play mati, eyebrow-nya berbunyi
"TRACK DEMO BELUM ADA", dan tidak ada satu angka pun yang bergerak —
tidak ada fallback yang berpura-pura ada musik.
