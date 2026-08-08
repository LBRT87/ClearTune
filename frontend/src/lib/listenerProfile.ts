import { supabase } from "./supabase";
import { getPublicClient } from "./serverWallet";
import { CLEARTUNE_ADDRESS, clearTuneAbi } from "./contracts";

export type SupportedArtist = { artist: string; plays: number };
export type PlaysByDay = { date: string; plays: number };

export type ListenerProfile = {
  wallet: string;
  balance: bigint;
  ratePerPlay: bigint;
  trustScore: number | null;
  supportedArtists: SupportedArtist[];
  totalPlays: number;
  playsByDay: PlaysByDay[];
};

export async function getListenerProfile(wallet: `0x${string}`): Promise<ListenerProfile> {
  const client = getPublicClient();

  const [config, balance] = await Promise.all([
    client.readContract({ address: CLEARTUNE_ADDRESS, abi: clearTuneAbi, functionName: "getConfig" }).catch(() => [0n, 0, 0n] as const),
    client.readContract({ address: CLEARTUNE_ADDRESS, abi: clearTuneAbi, functionName: "balance", args: [wallet] }).catch(() => 0n),
  ]);

  const { data: plays } = await supabase
    .from("plays")
    .select("song_id, played_at, status, songs(artist)")
    .eq("wallet", wallet)
    .eq("status", "paid")
    .order("played_at", { ascending: true });

  const { data: stats } = await supabase.from("wallet_stats").select("trust_score").eq("wallet", wallet).maybeSingle();

  const artistCounts = new Map<string, number>();
  const dayCounts = new Map<string, number>();
  for (const p of (plays ?? []) as unknown as { songs: { artist: string } | null; played_at: string }[]) {
    const artist = p.songs?.artist ?? "Unknown";
    artistCounts.set(artist, (artistCounts.get(artist) ?? 0) + 1);
    const day = p.played_at.slice(0, 10);
    dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
  }
  const supportedArtists = Array.from(artistCounts.entries())
    .map(([artist, plays]) => ({ artist, plays }))
    .sort((a, b) => b.plays - a.plays);

  const playsByDay = Array.from(dayCounts.entries())
    .map(([date, plays]) => ({ date, plays }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    wallet,
    balance: balance as bigint,
    ratePerPlay: (config as readonly [bigint, number, bigint])[0],
    trustScore: stats?.trust_score ?? null,
    supportedArtists,
    totalPlays: plays?.length ?? 0,
    playsByDay,
  };
}
