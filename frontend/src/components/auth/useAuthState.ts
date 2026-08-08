"use client";

/* Mesin keadaan auth (tiket auth/05) — SATU tempat, bukan disebar.

   Ada EMPAT keadaan, bukan dua. Yang ketiga adalah yang paling sering
   dilupakan dan paling merusak:

   | keadaan      | artinya                              |
   |--------------|--------------------------------------|
   | loading      | Privy belum selesai memulihkan sesi  |
   | guest        | benar-benar tamu                     |
   | needs-role   | sesi ada, peran belum dipilih        |
   | ready        | lengkap                              |

   `needs-role` = orang yang menutup tab tepat setelah login Google tapi
   sebelum memilih peran. Saat kembali dia punya sesi Privy tapi tidak
   punya baris `profiles`. Guard yang cuma memeriksa `authenticated` akan
   melemparnya ke dashboard tanpa peran, dan halaman pecah.

   `loading` sama tajamnya: merender versi tamu selama `!ready` membuat
   orang yang SUDAH login melihat halaman daftar sekejap lalu terlempar.

   Keberadaan baris `profiles` adalah satu-satunya sumber kebenaran.
   `isNewUser` milik Privy menjawab pertanyaan lain ("baru di Privy") dan
   meleset persis pada keadaan ketiga. */

import { usePrivy } from "@privy-io/react-auth";
import { useCallback, useEffect, useState } from "react";
import type { Profile } from "@/lib/profile-types";

export type AuthStatus = "loading" | "guest" | "needs-role" | "ready";

export type AuthState = {
  status: AuthStatus;
  profile: Profile | null;
  email: string | null;
  /** `"memory"` berarti tiket 08 belum selesai dan profil belum tersimpan
   *  permanen. Shell dashboard wajib mengatakannya, bukan menyembunyikannya. */
  backend: "supabase" | "memory" | null;
  refresh: () => void;
};

export function useAuthState(): AuthState {
  const { ready, authenticated, user } = usePrivy();

  const [loaded, setLoaded] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [backend, setBackend] = useState<"supabase" | "memory" | null>(null);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!ready) return;

    if (!authenticated) {
      setProfile(null);
      setLoaded(true);
      return;
    }

    let cancelled = false;
    setLoaded(false);

    /* Cookie `privy-token` ikut otomatis — fetch same-origin mengirim
       cookie tanpa perlu header Authorization. */
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setProfile((data?.profile as Profile | null) ?? null);
        setBackend(data?.backend ?? null);
        setLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setProfile(null);
        setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [ready, authenticated, user?.id, nonce]);

  const status: AuthStatus = !ready || !loaded
    ? "loading"
    : !authenticated
      ? "guest"
      : profile
        ? "ready"
        : "needs-role";

  const email =
    user?.email?.address ??
    user?.google?.email ??
    null;

  return { status, profile, email, backend, refresh };
}
