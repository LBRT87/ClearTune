/* Loading paling luar: dipakai tiap segment yang tidak punya loading.tsx
   sendiri — landing (`/`) dan layar auth (`/masuk`, `/daftar`,
   `/pilih-peran`). Route di dalam `(app)` punya boundary yang lebih dekat
   di `(app)/loading.tsx`, jadi yang ini tidak ikut muncul di sana. */

import { PixelScreenLoader } from "@/components/ui/PixelLoader";

export default function Loading() {
  return <PixelScreenLoader label="MEMUAT" />;
}
