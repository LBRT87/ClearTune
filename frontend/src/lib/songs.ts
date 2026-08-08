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
// cover_url points at /public/covers (real promo photos the team supplied
// directly) — swap the two "(judul TBD)" titles once confirmed.
const SAMPLE_SONGS: SongRow[] = [
  {
    id: 1,
    song_id_onchain: 1,
    title: "24K Magic",
    artist: "Bruno Mars",
    duration: 226,
    storage_url: "/sample-audio/24k-magic.mp3",
    cover_url: "/covers/cover-1-bruno-mars.jpg",
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    song_id_onchain: 2,
    title: "Hati-Hati di Jalan",
    artist: "Tulus",
    duration: 264,
    storage_url: "/sample-audio/hati-hati-di-jalan.mp3",
    cover_url: "/covers/cover-2-tulus.jpg",
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    song_id_onchain: 3,
    title: "Naykilla (judul TBD)",
    artist: "Naykilla",
    duration: 200,
    storage_url: "/sample-audio/naykilla.mp3",
    cover_url: "/covers/cover-3-naykilla.jpg",
    created_at: new Date().toISOString(),
  },
  {
    id: 4,
    song_id_onchain: 4,
    title: "Ceritera",
    artist: "HIVI!",
    duration: 245,
    storage_url: "/sample-audio/ceritera.mp3",
    cover_url: "/covers/cover-4-hivi-ceritera.jpg",
    created_at: new Date().toISOString(),
  },
  {
    id: 5,
    song_id_onchain: 5,
    title: "Tenxi (judul TBD)",
    artist: "Tenxi",
    duration: 190,
    storage_url: "/sample-audio/tenxi.mp3",
    cover_url: "/covers/cover-5-tenxi.jpg",
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
