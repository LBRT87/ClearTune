import Link from "next/link";
import { getSongs } from "@/lib/songs";
import { CapStatusBanner } from "@/components/CapStatusBanner";
import { Card, StatRow } from "@/components/ui/Card";

export default async function CatalogPage() {
  const songs = await getSongs();

  return (
    <main className="max-w-[1040px] mx-auto px-5 py-12">
      <h1 className="font-display text-xl mb-8">KATALOG</h1>
      <CapStatusBanner />
      <div className="grid md:grid-cols-3 gap-6">
        {songs.map((song) => (
          <Link key={song.song_id_onchain} href={`/song/${song.song_id_onchain}`}>
            <Card eyebrow={`LAGU #${String(song.song_id_onchain).padStart(4, "0")}`} title={song.title.toUpperCase()}>
              <StatRow label="Artis" value={song.artist} />
              <StatRow label="Durasi" value={song.duration ? `${Math.floor(song.duration / 60)}:${String(song.duration % 60).padStart(2, "0")}` : "—"} />
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
