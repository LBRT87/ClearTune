import { supabaseAdmin } from "./supabase";
import { weightedChartScore } from "./trust/score";
import { getSongs, type SongRow } from "./songs";

export type ChartEntry = SongRow & { weightedScore: number; rawPlays: number; rank: number };

export function currentChartPeriod(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Chart berbobot (project-spec.md 5.3): Σ trust_score(wallet) × log(1 + plays by
 * that wallet), summed per song across all wallets that played it — not raw play
 * count. One wallet farming a song a thousand times only ever contributes
 * log(1001) to that song's score, and a low trust_score shrinks that further, so
 * wash-trading from a handful of wallets can't push a song to the top.
 *
 * Write-through into `chart_cache` on every call, matching this app's "backend
 * writes when it computes, no external indexer" pattern elsewhere.
 */
export async function computeTrendingChart(period: string = currentChartPeriod()): Promise<ChartEntry[]> {
  const songs = await getSongs();

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return songs.map((s, i) => ({ ...s, weightedScore: 0, rawPlays: 0, rank: i + 1 }));
  }

  const db = supabaseAdmin();
  const { data: plays } = await db.from("plays").select("wallet, song_id").eq("status", "paid");

  if (!plays || plays.length === 0) {
    return songs.map((s, i) => ({ ...s, weightedScore: 0, rawPlays: 0, rank: i + 1 }));
  }

  const countsByWalletSong = new Map<string, number>();
  for (const p of plays as { wallet: string; song_id: number }[]) {
    const key = `${p.wallet}-${p.song_id}`;
    countsByWalletSong.set(key, (countsByWalletSong.get(key) ?? 0) + 1);
  }

  const wallets = Array.from(new Set((plays as { wallet: string }[]).map((p) => p.wallet)));
  const { data: statsRows } = await db.from("wallet_stats").select("wallet, trust_score").in("wallet", wallets);
  const trustByWallet = new Map<string, number>();
  for (const row of (statsRows ?? []) as { wallet: string; trust_score: number | null }[]) {
    trustByWallet.set(row.wallet, row.trust_score ?? 0.5);
  }

  const scoreBySong = new Map<number, number>();
  const rawPlaysBySong = new Map<number, number>();
  for (const [key, count] of countsByWalletSong) {
    const [wallet, songIdStr] = key.split("-");
    const songId = Number(songIdStr);
    const trust = trustByWallet.get(wallet) ?? 0.5;
    scoreBySong.set(songId, (scoreBySong.get(songId) ?? 0) + weightedChartScore(trust, count));
    rawPlaysBySong.set(songId, (rawPlaysBySong.get(songId) ?? 0) + count);
  }

  const ranked: ChartEntry[] = songs
    .map((s) => ({
      ...s,
      weightedScore: scoreBySong.get(s.song_id_onchain) ?? 0,
      rawPlays: rawPlaysBySong.get(s.song_id_onchain) ?? 0,
      rank: 0,
    }))
    .sort((a, b) => b.weightedScore - a.weightedScore)
    .map((s, i) => ({ ...s, rank: i + 1 }));

  await db.from("chart_cache").upsert(
    ranked.map((s) => ({
      song_id: s.song_id_onchain,
      period,
      weighted_score: s.weightedScore,
      rank: s.rank,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "song_id,period" },
  );

  return ranked;
}
