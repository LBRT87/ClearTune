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

// Distinct artist names featured in a playlist, in first-appearance order —
// backs the "Artist A, Artist B and more" style subtitle on playlist cards.
export async function getPlaylistArtists(id: number): Promise<string[]> {
  const songs = await getPlaylistSongs(id);
  const seen = new Set<string>();
  const artists: string[] = [];
  for (const s of songs) {
    if (!seen.has(s.artist)) {
      seen.add(s.artist);
      artists.push(s.artist);
    }
  }
  return artists;
}

export function formatArtistList(artists: string[]): string | null {
  if (artists.length === 0) return null;
  const shown = artists.slice(0, 3).join(", ");
  return artists.length > 3 ? `${shown} and others` : shown;
}
