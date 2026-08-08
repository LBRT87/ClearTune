import { supabase } from "./supabase";
import { getSongs, type SongRow } from "./songs";

export type Playlist = {
  id: number;
  owner_wallet: string;
  name: string;
  cover_url: string | null;
  created_at: string;
};

export async function getPlaylistsByOwner(wallet: string): Promise<Playlist[]> {
  const { data } = await supabase
    .from("playlists")
    .select("*")
    .eq("owner_wallet", wallet)
    .order("created_at", { ascending: false });
  return (data ?? []) as Playlist[];
}

export async function getPlaylist(id: number): Promise<Playlist | undefined> {
  const { data } = await supabase.from("playlists").select("*").eq("id", id).maybeSingle();
  return (data as Playlist) ?? undefined;
}

export async function getPlaylistSongs(id: number): Promise<SongRow[]> {
  const { data: rows } = await supabase
    .from("playlist_songs")
    .select("song_id")
    .eq("playlist_id", id)
    .order("added_at", { ascending: true });

  const songIds = new Set((rows ?? []).map((r) => r.song_id as number));
  if (songIds.size === 0) return [];

  const allSongs = await getSongs();
  return allSongs.filter((s) => songIds.has(s.song_id_onchain));
}
