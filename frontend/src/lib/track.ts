/* Satu track demo (tiket 07). Dipisah dari komponen karena ini satu-satunya
   titik tukar file audio: user menaruh filenya di `public/demo/`, konstanta di
   bawah yang menunjuk ke sana. Tidak ada komponen yang menulis path sendiri.

   Katalog lebih dari satu track sengaja tidak ada — klaim halaman ini "satu
   play = royalti terbagi", dan track kedua tidak menambah bukti apa pun. */

export const TRACK = {
  title: "KICAU MANIA",
  artist: "boycord",
  /* Path relatif ke `public/`. Ganti di sini kalau nama/ekstensi filenya beda. */
  src: "/demo/musik.mp3",
} as const;

/* Ambang satu play — berapa detik harus benar-benar terdengar sebelum play
   dihitung dan settlement dijalankan. Konvensi industri 30 detik (Spotify);
   di sini dipendekkan supaya bisa dilihat dalam satu demo, dan angkanya
   ditulis di panel supaya juri tahu persis apa yang mereka lihat.

   Dibatasi juga oleh separuh durasi track: kalau nanti file demonya lebih
   pendek dari 20 detik, 10 detik akan berarti "play dihitung sebelum
   setengahnya terdengar" — dan itu ambang yang tidak akan bertahan kalau
   ditanya. */
export const PLAY_THRESHOLD_S = 10;

export const thresholdFor = (duration: number) =>
  duration > 0 ? Math.min(PLAY_THRESHOLD_S, duration / 2) : PLAY_THRESHOLD_S;

/** 227.4 -> "3:47" */
export const mmss = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
};

/** 7.63 -> "7.6" — one decimal place. */
export const secs = (s: number) => Math.max(0, s).toFixed(1);
