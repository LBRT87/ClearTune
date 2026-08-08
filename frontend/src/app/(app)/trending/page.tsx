import { computeTrendingChart } from "@/lib/chart";
import { Card, StatRow } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";

export default async function TrendingPage() {
  const chart = await computeTrendingChart();
  const hasPlays = chart.some((c) => c.rawPlays > 0);

  return (
    <main className="max-w-[1040px] mx-auto px-5 py-12">
      <h1 className="font-display text-xl mb-4">TRENDING</h1>
      <p className="text-dim text-lg mb-10 max-w-[60ch]">
        Diranking pakai trust score × log(play), bukan play mentah — satu dompet yang farming
        satu lagu ribuan kali cuma nambah sedikit ke skor (diminishing returns), dan makin
        rendah trust score dompetnya makin kecil lagi kontribusinya.
      </p>

      {!hasPlays && (
        <p className="text-dim text-lg mb-8">Belum ada data play — urutan masih default katalog.</p>
      )}

      <div className="grid gap-4">
        {chart.map((song) => (
          <Card key={song.song_id_onchain} eyebrow={`#${song.rank}`} title={song.title.toUpperCase()}>
            <StatRow label="Artis" value={song.artist} />
            <StatRow label="Play mentah" value={String(song.rawPlays)} />
            <StatRow label="Skor berbobot" value={song.weightedScore.toFixed(3)} accent />
            {song.rawPlays > 0 && song.weightedScore / Math.max(song.rawPlays, 1) < 0.3 && (
              <div className="mt-3">
                <Tag variant="red">POLA MENCURIGAKAN</Tag>
              </div>
            )}
          </Card>
        ))}
      </div>
    </main>
  );
}
