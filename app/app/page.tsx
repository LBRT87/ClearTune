"use client";

/* `/app` — beranda dengar (tiket auth/05).

   Tanpa `role`: terbuka untuk musisi maupun pendengar. Peran menentukan
   ke mana orang MENDARAT, bukan apa yang boleh dia buka — musisi jelas
   juga mendengarkan. */

import { AuthBoundary } from "@/components/auth/AuthBoundary";
import { DashboardShell } from "@/components/auth/DashboardShell";
import { AuthUnavailable, isAuthUsable } from "@/components/auth/AuthUnavailable";

export default function AppPage() {
  if (!isAuthUsable) return <AuthUnavailable />;

  return (
    <AuthBoundary want="dashboard">
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
