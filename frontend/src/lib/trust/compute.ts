import type { SupabaseClient } from "@supabase/supabase-js";
import { computeTrustScore, type TrustScoreResult, type WalletFeatures } from "./score";

/**
 * Recomputes and write-throughs a wallet's trust_score into `wallet_stats`.
 * Called right after every reportPlays settlement (see api/reportPlays) so
 * the trending chart's weighting stays current — trust scoring is otherwise
 * dead weight if nothing ever refreshes it. Also callable directly via
 * GET /api/trust for on-demand inspection.
 */
export async function recomputeWalletTrust(db: SupabaseClient, wallet: string): Promise<TrustScoreResult> {
  const { data: plays } = await db
    .from("plays")
    .select("song_id, played_at, completed, status, songs(artist)")
    .eq("wallet", wallet)
    .eq("status", "paid")
    .order("played_at", { ascending: true });

  if (!plays || plays.length === 0) {
    return { wallet, trustScore: 0.5, components: { entropy: 0, cvGap: 0, skipPenalty: 0, ageBonus: 0 } };
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

  return result;
}
