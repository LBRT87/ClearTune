"use client";

import "../landing.css";
import { AuthBoundary } from "@/components/auth/AuthBoundary";
import { RolePicker } from "@/components/auth/RolePicker";
import { AuthUnavailable, isAuthUsable } from "@/components/auth/AuthUnavailable";
import { roleFromParam } from "@/lib/profile-types";

export default function ChooseRolePage({
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
