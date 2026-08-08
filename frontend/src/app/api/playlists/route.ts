import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Playlists aren't part of project-spec.md — added on direct request.
// Ownership is just the wallet string passed by the client, no
// signature-based auth (fine for a demo, not for production).
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { ownerWallet, name, coverUrl } = body as { ownerWallet?: string; name?: string; coverUrl?: string };

  if (!ownerWallet || !name?.trim()) {
    return NextResponse.json({ error: "ownerWallet and name are required" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("playlists")
    .insert({ owner_wallet: ownerWallet, name: name.trim(), cover_url: coverUrl ?? null })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
