import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { computeTrustScore, type WalletFeatures } from "@/lib/trust/score";

// Trust layer never blocks payment — it only computes a score that later feeds
// chart_cache.weighted_score. See project-spec.md section 9.
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) {
    return NextResponse.json({ error: "missing ?wallet=" }, { status: 400 });
  }

  const db = supabaseAdmin();

  const { data: plays, error } = await db
    .from("plays")
    .select("song_id, played_at, completed, status, songs(artist)")
    .eq("wallet", wallet)
    .eq("status", "paid")
    .order("played_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!plays || plays.length === 0) {
    return NextResponse.json({ wallet, trustScore: 0.5, note: "no play history yet" });
  }

  const artistCounts = new Map<string, number>();
  for (const p of plays as unknown as { songs: { artist: string } | null }[]) {
    const artist = p.songs?.artist ?? "unknown";
    artistCounts.set(artist, (artistCounts.get(artist) ?? 0) + 1);
  }

  const timestamps = plays.map((p) => new Date(p.played_at as string).getTime());
  const skipRatio = plays.filter((p) => !p.completed).length / plays.length;

  const { data: walletRow } = await db
    .from("wallet_stats")
    .select("first_seen")
    .eq("wallet", wallet)
    .maybeSingle();

  const firstSeen = walletRow?.first_seen ? new Date(walletRow.first_seen).getTime() : timestamps[0];
  const walletAgeDays = Math.max(0, (Date.now() - firstSeen) / (1000 * 60 * 60 * 24));

  const features: WalletFeatures = {
    wallet,
    playCountsByArtist: Array.from(artistCounts.values()),
    playTimestampsMs: timestamps,
    skipRatio,
    walletAgeDays,
  };

  const result = computeTrustScore(features);

  await db.from("wallet_stats").upsert(
    {
      wallet,
      trust_score: result.trustScore,
      skip_ratio: skipRatio,
      funder: null,
      first_seen: walletRow?.first_seen ?? new Date(firstSeen).toISOString(),
    },
    { onConflict: "wallet" },
  );

  return NextResponse.json(result);
}
