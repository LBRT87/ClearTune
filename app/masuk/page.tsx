"use client";

/* `/masuk` (tiket auth/05). Route terpisah dari `/daftar` walau mesinnya
   identik — Privy tidak mengenal beda daftar vs masuk, tapi orang yang
   menekan "BUKA APP" datang dengan pertanyaan yang berbeda. */

import { AuthBoundary } from "@/components/auth/AuthBoundary";
import { GateScreen } from "@/components/auth/GateScreen";
import { AuthUnavailable, isAuthUsable } from "@/components/auth/AuthUnavailable";

export default function MasukPage() {
  if (!isAuthUsable) return <AuthUnavailable />;

  return (
    <AuthBoundary want="guest">
      {/* `role` tidak dipakai layar masuk — ia sengaja tidak menyebut peran
          sama sekali. Argumen ini cuma memenuhi tipe bersama `/daftar`. */}
      {() => <GateScreen kind="masuk" role="pendengar" />}
    </AuthBoundary>
  );
}
