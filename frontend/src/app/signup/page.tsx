"use client";

import "../landing.css";
import { AuthBoundary } from "@/components/auth/AuthBoundary";
import { GateScreen } from "@/components/auth/GateScreen";
import { AuthUnavailable, isAuthUsable } from "@/components/auth/AuthUnavailable";

export default function SignupPage({
  searchParams,
}: {
  searchParams: { role?: string };
}) {
  if (!isAuthUsable) return <AuthUnavailable />;

  const role = searchParams.role === "artist" ? "artist" : "listener";

  return (
    <AuthBoundary want="guest">
      {() => <GateScreen kind="signup" role={role} />}
    </AuthBoundary>
  );
}
