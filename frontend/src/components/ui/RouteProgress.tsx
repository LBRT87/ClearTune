"use client";

/* Bar tipis di puncak layar selama pindah halaman.

   loading.tsx baru muncul setelah router memutuskan segment mana yang
   dimuat; klik → jeda itu tidak punya umpan balik apa pun, dan di halaman
   yang isinya sudah ter-cache boundary-nya bahkan tidak pernah menyala.
   Bar ini mengisi celah tersebut.

   Next 14 belum punya `useLinkStatus`, jadi awal navigasi dibaca dari klik
   pada <a> internal (fase capture, supaya tetap terbaca walau handler lain
   memanggil stopPropagation), dan akhirnya dibaca dari perubahan URL. */

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function RouteProgress() {
  const pathname = usePathname();
  /* String, bukan objeknya: useSearchParams boleh mengembalikan instance
     baru tiap render, dan sebagai dependency itu memadamkan bar di render
     berikutnya — jauh sebelum halaman tujuan datang. */
  const search = useSearchParams().toString();
  const [pending, setPending] = useState(false);

  // URL sudah berganti berarti navigasinya selesai.
  useEffect(() => setPending(false), [pathname, search]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      // Klik tengah, klik dengan modifier, dan tab baru diurus browser —
      // halaman ini tidak berpindah, jadi bar tidak boleh menyala.
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as Element | null)?.closest?.("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const next = new URL(anchor.href, window.location.href);
      if (next.origin !== window.location.origin) return;
      // Tujuan sama dengan tempat sekarang: tidak ada yang dimuat.
      if (next.pathname + next.search === window.location.pathname + window.location.search) return;

      setPending(true);
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  /* Jaring pengaman. Navigasi bisa batal tanpa mengubah URL — guard yang
     melempar balik ke tempat yang sama, atau prefetch yang gagal — dan bar
     yang menyala selamanya lebih buruk daripada bar yang tidak muncul. */
  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => setPending(false), 8000);
    return () => clearTimeout(timer);
  }, [pending]);

  if (!pending) return null;

  return <div className="route-progress" role="status" aria-label="Memuat halaman" />;
}
