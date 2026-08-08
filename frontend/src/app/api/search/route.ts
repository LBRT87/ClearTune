import { NextRequest, NextResponse } from "next/server";
import { getSongs } from "@/lib/songs";

// Backs the top-bar search — matches by song title or artist name (not
// wallet address), so listeners can find music the way they'd expect.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const songs = await getSongs();
  const results = songs
    .filter((s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q))
    .slice(0, 8)
    .map((s) => ({ id: s.song_id_onchain, title: s.title, artist: s.artist }));

  return NextResponse.json({ results });
}
