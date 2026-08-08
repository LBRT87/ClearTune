"use client";

/* `/daftar`.

   Di luar route group `(app)` dengan sengaja: layar auth setinggi
   viewport tanpa Sidebar/TopBar — satu keputusan per layar.

   `?role=` datang dari CTA landing: DENGAR SEKARANG → pendengar,
   SAYA MUSISI → musisi. Ia memilihkan copy di sini dan kartu di layar
   pilih peran — tidak mengunci apa pun. */

import "../landing.css";
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
