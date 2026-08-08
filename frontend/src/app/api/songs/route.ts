import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Write-through: called after the artist's own wallet has already confirmed
// registerSong() on-chain. This only persists the off-chain metadata
// (title/artist/duration/storage url) — the source of truth for payees/bps
// stays on-chain.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { songIdOnchain, title, artist, duration, storageUrl, coverUrl } = body as {
    songIdOnchain: number;
    title: string;
    artist: string;
    duration?: number;
    storageUrl: string;
    coverUrl?: string;
  };

  if (!songIdOnchain || !title || !artist || !storageUrl) {
    return NextResponse.json({ error: "songIdOnchain, title, artist, storageUrl are required" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { error } = await db.from("songs").insert({
    song_id_onchain: songIdOnchain,
    title,
    artist,
    duration: duration ?? null,
    storage_url: storageUrl,
    cover_url: coverUrl ?? null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
