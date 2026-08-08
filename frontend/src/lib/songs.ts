import { supabase } from "./supabase";

export type SongRow = {
  id: number;
  song_id_onchain: number;
  title: string;
  artist: string;
  duration: number | null;
  storage_url: string;
  cover_url: string | null;
  created_at: string;
};

// Falls back to sample rows when Supabase isn't configured yet, so the
// catalog isn't blank before the DB is seeded — see README "Testing it".
const SAMPLE_SONGS: SongRow[] = [
  {
    id: 1,
    song_id_onchain: 1,
    title: "Senja di Pasar Minggu",
    artist: "Hindia",
    duration: 214,
    storage_url: "/sample-audio/senja.mp3",
    cover_url: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    song_id_onchain: 2,
    title: "Ruang Sendiri",
    artist: "Feast",
    duration: 198,
    storage_url: "/sample-audio/ruang-sendiri.mp3",
    cover_url: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    song_id_onchain: 3,
    title: "Konservatif",
    artist: "Barasuara",
    duration: 240,
    storage_url: "/sample-audio/konservatif.mp3",
    cover_url: null,
    created_at: new Date().toISOString(),
  },
];

export async function getSongs(): Promise<SongRow[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return SAMPLE_SONGS;

  const { data, error } = await supabase.from("songs").select("*").order("created_at", { ascending: false });
  if (error || !data || data.length === 0) return SAMPLE_SONGS;
  return data as SongRow[];
}

export async function getSongById(songIdOnchain: number): Promise<SongRow | undefined> {
  const songs = await getSongs();
  return songs.find((s) => s.song_id_onchain === songIdOnchain);
}
