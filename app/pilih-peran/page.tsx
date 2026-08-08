"use client";

/* Layar pilih peran — route sendiri (tiket auth/05).

   Punya URL sendiri, bukan sekadar state di dalam `/daftar`, karena guard
   perlu tempat yang jelas untuk melempar orang yang punya sesi tapi belum
   punya peran — termasuk orang yang mengetik `/studio` langsung di address
   bar setelah menutup tab di tengah alur. */

import { AuthBoundary } from "@/components/auth/AuthBoundary";
import { RolePicker } from "@/components/auth/RolePicker";
import { AuthUnavailable, isAuthUsable } from "@/components/auth/AuthUnavailable";
import { roleFromParam } from "@/lib/profile-types";

export default function PilihPeranPage({
  searchParams,
}: {
  searchParams: { role?: string };
}) {
  if (!isAuthUsable) return <AuthUnavailable />;

  const preselected = roleFromParam(searchParams.role);

  return (
    <AuthBoundary want="role-picker">
      {(auth) => <RolePicker preselected={preselected} onDone={auth.refresh} />}
    </AuthBoundary>
  );
}
