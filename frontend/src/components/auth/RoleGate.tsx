"use client";

/* Penjaga peran untuk route group `(app)`.

   `AuthBoundary` sudah memeriksa peran, tapi hanya di route auth
   (`/daftar`, `/masuk`, `/pilih-peran`). Ada satu pintu masuk yang
   melewatinya: tombol MASUK di Sidebar/TopBar (`ConnectWalletButton`)
   memanggil `login()` milik Privy langsung, dari halaman mana pun di
   dalam `(app)`. Orang yang login dari `/catalog` atau `/song/[id]`
   dapat sesi Privy tanpa pernah melihat layar pilih peran — lalu
   menjelajah app tanpa baris `profiles`, dan tiap fitur yang membaca
   `profile.role` pecah di tangannya.

   Yang dijaga HANYA `needs-role`, bukan `guest`. Keputusan produk di
   `AuthBoundary` tetap berlaku: app ini boleh dijelajahi tanpa login
   (katalog, halaman lagu), jadi tamu tidak diusir ke mana-mana. Yang
   dijemput cuma orang yang sudah punya sesi tapi belum punya peran —
   termasuk yang menutup tab di tengah alur lalu kembali lewat link
   dalam app, bukan lewat `/masuk`.

   Tidak merender apa pun. Menahan seluruh shell selama `loading` akan
   membuat halaman publik berkedip kosong untuk tamu, padahal tamu
   memang tidak ke mana-mana. */

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isAuthUsable } from "./AuthUnavailable";
import { useAuthState } from "./useAuthState";

export function RoleGate() {
  /* Tanpa App ID, `PrivyProvider` tidak dipasang sama sekali
     (`providers.tsx`), dan `usePrivy()` di dalam `useAuthState` akan
     melempar. Cabang ini konstan sepanjang hidup halaman — nilainya
     di-inline saat build — jadi hook di bawahnya tidak pernah berubah
     jumlah antar render. */
  if (!isAuthUsable) return null;
  return <RoleGateActive />;
}

function RoleGateActive() {
  const { status } = useAuthState();
  const router = useRouter();

  useEffect(() => {
    /* `/choose-role` ada di luar `(app)`, jadi penjaga ini tidak ikut
       ter-mount di sana dan tidak bisa memantul bolak-balik. */
    if (status === "needs-role") router.replace("/choose-role");
  }, [status, router]);

  return null;
}
