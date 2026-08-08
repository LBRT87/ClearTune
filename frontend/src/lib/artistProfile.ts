import { getSongs, type SongRow } from "./songs";
import { getPublicClient } from "./serverWallet";
import { CLEARTUNE_ADDRESS, clearTuneAbi } from "./contracts";
import { supabase } from "./supabase";

export type ArtistSongStat = SongRow & { totalPlays: number; skippedPlays: number };

export type ArtistProfile = {
  wallet: string;
  earned: bigint;
  songs: ArtistSongStat[];
};

export async function getArtistProfile(wallet: `0x${string}`): Promise<ArtistProfile> {
  const client = getPublicClient();
  const allSongs = await getSongs();

  const payeeChecks = await Promise.all(
    allSongs.map((s) =>
      client
        .readContract({
          address: CLEARTUNE_ADDRESS,
          abi: clearTuneAbi,
          functionName: "getSongPayees",
          args: [BigInt(s.song_id_onchain)],
        })
        .catch(() => [[], []] as readonly [readonly `0x${string}`[], readonly number[]]),
    ),
  );

  const mySongs = allSongs.filter((_, i) => {
    const [payees] = payeeChecks[i] as readonly [readonly `0x${string}`[], readonly number[]];
    return payees.some((p) => p.toLowerCase() === wallet.toLowerCase());
  });

  const songIds = mySongs.map((s) => s.song_id_onchain);
  const { data: plays } = songIds.length
    ? await supabase.from("plays").select("song_id, status").in("song_id", songIds)
    : { data: [] };

  const songs: ArtistSongStat[] = mySongs.map((s) => {
    const rows = (plays ?? []).filter((p) => p.song_id === s.song_id_onchain);
    return {
      ...s,
      totalPlays: rows.filter((p) => p.status === "paid").length,
      skippedPlays: rows.filter((p) => p.status === "skipped_low_balance").length,
    };
  });

  const earned = await client
    .readContract({ address: CLEARTUNE_ADDRESS, abi: clearTuneAbi, functionName: "earned", args: [wallet] })
    .catch(() => 0n);

  return { wallet, earned: earned as bigint, songs };
}
