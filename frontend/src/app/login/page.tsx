"use client";

import "../landing.css";
import { AuthBoundary } from "@/components/auth/AuthBoundary";
import { GateScreen } from "@/components/auth/GateScreen";
import { AuthUnavailable, isAuthUsable } from "@/components/auth/AuthUnavailable";

export default function LoginPage() {
  if (!isAuthUsable) return <AuthUnavailable />;

  return (
    <AuthBoundary want="guest">
      {() => <GateScreen kind="login" role="listener" />}
    </AuthBoundary>
  );
}
