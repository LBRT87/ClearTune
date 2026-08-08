import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Write-through, called from the dashboard's story composer — the UI only
// shows that composer to wallets that already own a registered song
// (checked on-chain), same trust model as the rest of this app (no
// signature-based auth, see supabase/schema.sql).
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { artistWallet, artistName, caption, imageUrl } = body as {
    artistWallet?: string;
    artistName?: string;
    caption?: string;
    imageUrl?: string;
  };

  if (!artistWallet || !artistName?.trim()) {
    return NextResponse.json({ error: "artistWallet and artistName are required" }, { status: 400 });
  }
  if (!caption?.trim() && !imageUrl) {
    return NextResponse.json({ error: "caption or imageUrl is required" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { error } = await db.from("artist_stories").insert({
    artist_wallet: artistWallet,
    artist_name: artistName.trim(),
    caption: caption?.trim() || null,
    image_url: imageUrl || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
