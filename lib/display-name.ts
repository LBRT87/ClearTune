/* Nama tampilan pendengar (tiket auth/04).

   Diacak DI KLIEN lalu dibawa ke API, bukan diacak ulang di server.
   Alasannya datang dari varian C yang dipilih di tiket 03: layar pilih
   peran menampilkan nama itu ke orangnya di langkah 2, sebelum dia masuk.
   Kalau server mengacak sendiri, yang dilihat orang di layar bukan yang
   tersimpan — dan itu kebohongan kecil yang tidak perlu.

   Diacak SEKALI lalu disimpan, bukan diturunkan dari DID: nama orang tidak
   boleh berubah hanya karena isi `CURSOR_NAMES` diubah. */

import { CURSOR_NAMES } from "./cursor-identity";

export function randomListenerName(): string {
  return CURSOR_NAMES[Math.floor(Math.random() * CURSOR_NAMES.length)];
}
