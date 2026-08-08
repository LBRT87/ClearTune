import Link from "next/link";
import { notFound } from "next/navigation";
import { getSongById } from "@/lib/songs";
import { getSplitSheet } from "@/lib/splitSheet";
import { PlayerControls } from "@/components/PlayerControls";
import { AddToPlaylistButton } from "@/components/AddToPlaylistButton";
import { Card, StatRow } from "@/components/ui/Card";

function short(wallet: string) {
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

export default async function SongPage({ params }: { params: { id: string } }) {
  const song = await getSongById(Number(params.id));
  if (!song) notFound();

  const splitSheet = await getSplitSheet(song.song_id_onchain);

  return (
    <main className="max-w-[1040px] mx-auto px-5 py-12">
      <span className="text-dim font-display text-[10px] block mb-4">
        LAGU #{String(song.song_id_onchain).padStart(4, "0")}
      </span>
      <h1 className="font-display text-xl mb-2">{song.title.toUpperCase()}</h1>
      <p className="text-dim text-xl mb-8">{song.artist}</p>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <Card>
          <PlayerControls songId={song.song_id_onchain} />
          <div className="mt-6 pt-6 border-t border-dashed border-dim">
            <AddToPlaylistButton songId={song.song_id_onchain} />
          </div>
        </Card>
        <Card eyebrow="RINCIAN">
          <StatRow
            label="Durasi"
            value={song.duration ? `${Math.floor(song.duration / 60)}:${String(song.duration % 60).padStart(2, "0")}` : "—"}
          />
          <StatRow label="Sumber file" value={song.storage_url} />
        </Card>
      </div>

      <Card eyebrow="SPLIT SHEET — KE MANA ROYALTI PERGI" className="max-w-none">
        {splitSheet.length === 0 && (
          <p className="text-dim text-lg">Belum bisa dibaca dari kontrak (belum ter-deploy, atau lagu belum terdaftar on-chain).</p>
        )}
        {splitSheet.map((row) => (
          <div key={row.address} className="stat-row">
            <Link href={`/artist/${row.address}`} className="text-purple hover:underline font-mono text-lg">
              {short(row.address)}
            </Link>
            <span className="font-display text-[11px]">{(row.bps / 100).toFixed(2)}%</span>
          </div>
        ))}
      </Card>
    </main>
  );
}
