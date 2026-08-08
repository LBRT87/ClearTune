"use client";

/* Guard untuk route auth — satu tempat, bukan disebar.

   Tiap halaman menyatakan keadaan yang ia layani (`want`), dan boundary
   ini yang mengurus keadaan lainnya.

   Selama `loading` yang dirender adalah layar KOSONG dengan geometri yang
   sama, bukan versi tamu. Merender "belum login" selama Privy masih
   memulihkan sesi membuat orang yang SUDAH login melihat halaman daftar
   sekejap lalu terlempar.

   CATATAN CAKUPAN: boundary ini hanya menjaga route auth
   (`/daftar`, `/masuk`, `/pilih-peran`). Route `(app)` sengaja TIDAK
   dijaga — app ini bisa dijelajahi tanpa login (katalog, halaman lagu),
   dan menggembok semuanya di balik profil adalah keputusan produk, bukan
   pekerjaan port ini. Akibatnya orang yang punya sesi tapi belum memilih
   peran masih bisa membuka `(app)` tanpa peran; lihat catatan di tiket. */

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { homeFor } from "@/lib/profile-types";
import { useAuthState, type AuthState } from "./useAuthState";

type Want = "guest" | "role-picker";

export function AuthBoundary({
  want,
  children,
}: {
  want: Want;
  children: (auth: AuthState) => React.ReactNode;
}) {
  const auth = useAuthState();
  const router = useRouter();
  const { status, profile } = auth;

  useEffect(() => {
    if (status === "loading") return;

    /* `?role=` ikut dibawa ke mana pun guard melempar, dua arah. CTA
       landing memilihkan copy di `/daftar` dan kartu di layar pilih peran;
       menjatuhkan query di sini membuat orang yang menekan "SAYA MUSISI"
       mendarat di kalimat sambutan untuk pendengar.
       Dibaca dari `location` langsung, bukan `useSearchParams`, supaya
       halaman ini tidak menuntut Suspense boundary. */
    const search = typeof window === "undefined" ? "" : window.location.search;

    if (want === "guest") {
      if (status === "needs-role") router.replace(`/choose-role${search}`);
      if (status === "ready" && profile) router.replace(homeFor(profile.role));
      return;
    }

    /* want === "role-picker" */
    if (status === "guest") router.replace(`/signup${search}`);
    if (status === "ready" && profile) router.replace(homeFor(profile.role));
  }, [status, profile, want, router]);

  const matches =
    (want === "guest" && status === "guest") ||
    (want === "role-picker" && status === "needs-role");

  /* Menahan: geometri sama, isi kosong. Tidak ada teks "memuat" — kedipan
     satu kata justru lebih terasa daripada layar diam. */
  if (!matches) return <div className="auth-screen" aria-busy="true" />;

  return <>{children(auth)}</>;
}
