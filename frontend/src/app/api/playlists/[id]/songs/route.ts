import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { songId } = (await req.json()) as { songId?: number };
  const playlistId = Number(params.id);
  if (!songId) return NextResponse.json({ error: "songId is required" }, { status: 400 });

  const db = supabaseAdmin();
  const { error } = await db.from("playlist_songs").insert({ playlist_id: playlistId, song_id: songId });
  // Adding the same song twice hits the primary key — treat as a no-op, not an error.
  if (error && error.code !== "23505") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const songId = Number(req.nextUrl.searchParams.get("songId"));
  const playlistId = Number(params.id);
  if (!songId) return NextResponse.json({ error: "songId query param is required" }, { status: 400 });

  const db = supabaseAdmin();
  const { error } = await db.from("playlist_songs").delete().eq("playlist_id", playlistId).eq("song_id", songId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
