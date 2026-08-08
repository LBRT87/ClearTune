/* Loading untuk shell `(app)`. Sidebar dan topbar hidup di layout, jadi
   keduanya tetap terlihat saat halaman berganti — yang diganti hanya isi
   kolom kanan. Halaman yang punya loading.tsx sendiri (katalog, dashboard,
   lagu, playlist, profil) memakai punyanya; sisanya — home, admin,
   register, subscribe — jatuh ke sini. */

import { PixelPageLoader } from "@/components/ui/PixelLoader";

export default function Loading() {
  return <PixelPageLoader label="MEMUAT HALAMAN" />;
}
