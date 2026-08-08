import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { ownerWallet } = (await req.json()) as { ownerWallet?: string };
  const playlistId = Number(params.id);

  const db = supabaseAdmin();
  const { data: playlist } = await db.from("playlists").select("owner_wallet").eq("id", playlistId).maybeSingle();

  if (!playlist) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!ownerWallet || playlist.owner_wallet.toLowerCase() !== ownerWallet.toLowerCase()) {
    return NextResponse.json({ error: "not the playlist owner" }, { status: 403 });
  }

  const { error } = await db.from("playlists").delete().eq("id", playlistId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
