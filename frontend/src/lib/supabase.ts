import { createClient } from "@supabase/supabase-js";

// Browser/client-side: anon key only, respects RLS. Falls back to a
// placeholder URL so the module doesn't throw at build/import time before
// env vars are configured — see README "Testing it" for real setup.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key",
);

// Server-side only (API routes) — service role bypasses RLS, never import
// this into a client component.
export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createClient(url, key);
}
