import { supabase } from "./supabase";

export type ArtistStory = {
  id: number;
  artist_wallet: string;
  artist_name: string;
  caption: string | null;
  image_url: string | null;
  created_at: string;
};

// Stories only stay live for 24h, matching the format they're modeled on.
const STORY_WINDOW_MS = 24 * 60 * 60 * 1000;

// Falls back to sample rows when Supabase isn't configured yet, so the
// story bar isn't empty before real artists start posting — same pattern as
// SAMPLE_SONGS in lib/songs.ts. Timestamps are computed at call time so they
// always land inside the 24h window regardless of when this runs.
function sampleStories(): ArtistStory[] {
  const now = Date.now();
  const minutesAgo = (m: number) => new Date(now - m * 60 * 1000).toISOString();
  return [
    {
      id: 1,
      artist_wallet: "0x1111111111111111111111111111111111b0b0",
      artist_name: "Bruno Mars",
      caption: "New record vibes — stream 24K Magic now.",
      image_url: "/covers/cover-1-bruno-mars.jpg",
      created_at: minutesAgo(20),
    },
    {
      id: 2,
      artist_wallet: "0x2222222222222222222222222222222222701a",
      artist_name: "Tulus",
      caption: "Makasih udah nemenin perjalanan ini.",
      image_url: "/covers/cover-2-tulus.jpg",
      created_at: minutesAgo(55),
    },
    {
      id: 3,
      artist_wallet: "0x3333333333333333333333333333333333ca11",
      artist_name: "Naykilla",
      caption: "New drop coming soon — stay tuned.",
      image_url: "/covers/cover-3-naykilla.jpg",
      created_at: minutesAgo(120),
    },
    {
      id: 4,
      artist_wallet: "0x4444444444444444444444444444444444419e",
      artist_name: "HIVI!",
      caption: "Ceritera baru, dengerin sekarang di ClearTune.",
      image_url: "/covers/cover-4-hivi-ceritera.jpg",
      created_at: minutesAgo(240),
    },
    {
      id: 5,
      artist_wallet: "0x5555555555555555555555555555555555fe17",
      artist_name: "Tenxi",
      caption: "Behind the scenes bikin track baru.",
      image_url: "/covers/cover-5-tenxi.jpg",
      created_at: minutesAgo(400),
    },
  ];
}

export async function getRecentStories(): Promise<ArtistStory[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return sampleStories();

  const since = new Date(Date.now() - STORY_WINDOW_MS).toISOString();
  const { data, error } = await supabase
    .from("artist_stories")
    .select("*")
    .gte("created_at", since)
    .order("created_at", { ascending: false });
  if (error || !data || data.length === 0) return sampleStories();
  return data as ArtistStory[];
}

// One entry per artist (their most recent story), preserving recency order.
export function latestPerArtist(stories: ArtistStory[]): ArtistStory[] {
  const seen = new Set<string>();
  const result: ArtistStory[] = [];
  for (const s of stories) {
    if (!seen.has(s.artist_wallet)) {
      seen.add(s.artist_wallet);
      result.push(s);
    }
  }
  return result;
}
