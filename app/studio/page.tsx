"use client";

/* `/studio` — milik musisi (tiket auth/05).

   `role="artist"`: pendengar yang mengetik URL ini langsung dilempar ke
   `/app`, bukan disuguhi halaman kosong. */

import { AuthBoundary } from "@/components/auth/AuthBoundary";
import { DashboardShell } from "@/components/auth/DashboardShell";
import { AuthUnavailable, isAuthUsable } from "@/components/auth/AuthUnavailable";

export default function StudioPage() {
  if (!isAuthUsable) return <AuthUnavailable />;

  return (
    <AuthBoundary want="dashboard" role="artist">
      {(auth) => (
        <DashboardShell
          profile={auth.profile!}
          email={auth.email}
          backend={auth.backend}
        />
      )}
    </AuthBoundary>
  );
}
