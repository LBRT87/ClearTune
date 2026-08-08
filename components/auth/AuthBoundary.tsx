"use client";

/* Guard — satu tempat, dipakai semua route terlindungi (tiket auth/05).

   Tiap halaman menyatakan keadaan yang ia layani (`want`), dan boundary
   ini yang mengurus tiga keadaan lainnya. Tidak ada halaman yang boleh
   memeriksa `authenticated` sendiri.

   Selama `loading` yang dirender adalah layar KOSONG dengan geometri yang
   sama, bukan versi tamu. Merender "belum login" selama Privy masih
   memulihkan sesi adalah bug kedipan yang sama dengan tiket 07. */

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { homeFor, type Role } from "@/lib/profile-types";
import { useAuthState, type AuthState } from "./useAuthState";

type Want = "guest" | "role-picker" | "dashboard";

export function AuthBoundary({
  want,
  role,
  children,
}: {
  want: Want;
  /** Hanya untuk `want="dashboard"`. `/studio` milik musisi; pendengar yang
   *  mengetiknya langsung dilempar ke `/app`. Sebaliknya TIDAK berlaku —
   *  musisi jelas juga mendengarkan, jadi `/app` terbuka untuk keduanya. */
  role?: Role;
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
      /* Sudah punya sesi: tidak ada gunanya melihat layar daftar lagi. */
      if (status === "needs-role") router.replace(`/pilih-peran${search}`);
      if (status === "ready" && profile) router.replace(homeFor(profile.role));
      return;
    }

    if (want === "role-picker") {
      if (status === "guest") router.replace(`/daftar${search}`);
      if (status === "ready" && profile) router.replace(homeFor(profile.role));
      return;
    }

    /* want === "dashboard" */
    if (status === "guest") router.replace("/masuk");
    /* Termasuk kalau dia mengetik `/studio` langsung di address bar. */
    if (status === "needs-role") router.replace("/pilih-peran");
    if (status === "ready" && profile && role && profile.role !== role) {
      router.replace(homeFor(profile.role));
    }
  }, [status, profile, want, role, router]);

  const matches =
    (want === "guest" && status === "guest") ||
    (want === "role-picker" && status === "needs-role") ||
    (want === "dashboard" &&
      status === "ready" &&
      (!role || profile?.role === role));

  /* Menahan: geometri yang sama, isi kosong. Tidak ada teks "memuat" —
     kedipan satu kata justru lebih terasa daripada layar diam. */
  if (!matches) return <div className="auth-screen" aria-busy="true" />;

  return <>{children(auth)}</>;
}
