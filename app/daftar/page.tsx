"use client";

/* `/daftar` (tiket auth/05).

   `?role=` datang dari CTA landing: DENGAR SEKARANG → pendengar,
   SAYA MUSISI → musisi. Ia memilihkan copy di sini dan kartu di layar
   pilih peran — tidak mengunci apa pun. */

import { AuthBoundary } from "@/components/auth/AuthBoundary";
import { GateScreen } from "@/components/auth/GateScreen";
import { AuthUnavailable, isAuthUsable } from "@/components/auth/AuthUnavailable";

export default function DaftarPage({
  searchParams,
}: {
  searchParams: { role?: string };
}) {
  if (!isAuthUsable) return <AuthUnavailable />;

  const role = searchParams.role === "musisi" ? "musisi" : "pendengar";

  return (
    <AuthBoundary want="guest">
      {() => <GateScreen kind="daftar" role={role} />}
    </AuthBoundary>
  );
}
