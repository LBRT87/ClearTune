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
        Ranked by trust score × log(plays), not raw play count — one wallet farming a song
        thousands of times only adds a little to its score (diminishing returns), and the
        lower that wallet's trust score, the smaller its contribution.
      </p>

      {!hasPlays && (
        <p className="text-dim text-lg mb-8">No play data yet — order still defaults to the catalog.</p>
      )}

      <div className="grid gap-4">
        {chart.map((song) => (
          <Card key={song.song_id_onchain} eyebrow={`#${song.rank}`} title={song.title.toUpperCase()}>
            <StatRow label="Artist" value={song.artist} />
            <StatRow label="Raw plays" value={String(song.rawPlays)} />
            <StatRow label="Weighted score" value={song.weightedScore.toFixed(3)} accent />
            {song.rawPlays > 0 && song.weightedScore / Math.max(song.rawPlays, 1) < 0.3 && (
              <div className="mt-3">
                <Tag variant="red">SUSPICIOUS PATTERN</Tag>
              </div>
            )}
          </Card>
        ))}
      </div>
    </main>
  );
}
