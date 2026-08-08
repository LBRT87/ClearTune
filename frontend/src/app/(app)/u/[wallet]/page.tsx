import { formatUnits } from "viem";
import { getListenerProfile } from "@/lib/listenerProfile";
import { Card, StatRow } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { ListeningTrendChart } from "@/components/charts/ListeningTrendChart";
import { TopArtistsChart } from "@/components/charts/TopArtistsChart";

function short(wallet: string) {
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

export default async function ListenerProfilePage({ params }: { params: { wallet: string } }) {
  const wallet = params.wallet as `0x${string}`;
  const profile = await getListenerProfile(wallet);

  const balanceEmpty = profile.ratePerPlay > 0n && profile.balance < profile.ratePerPlay;
  const remainingPlays = profile.ratePerPlay > 0n ? profile.balance / profile.ratePerPlay : 0n;
  const topArtist = profile.supportedArtists[0];

  return (
    <main className="max-w-[1040px] mx-auto px-5 py-12">
      <span className="text-dim font-display text-[10px] block mb-4">LISTENER PROFILE</span>
      <h1 className="font-display text-lg mb-2 break-all">{short(wallet)}</h1>
      <p className="text-dim text-lg mb-8 break-all">{wallet}</p>

      <div className="flex gap-3 flex-wrap mb-10">
        <Tag variant={balanceEmpty ? "yellow" : "green"}>{balanceEmpty ? "BALANCE EMPTY" : "BALANCE ACTIVE"}</Tag>
        {profile.trustScore !== null && (
          <Tag variant={profile.trustScore >= 0.6 ? "green" : profile.trustScore >= 0.3 ? "yellow" : "red"}>
            TRUST SCORE {(profile.trustScore * 100).toFixed(0)}%
          </Tag>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <Card eyebrow="BALANCE STATUS">
          <StatRow label="Current balance" value={`${formatUnits(profile.balance, 6)} mUSD`} />
          <StatRow label="Estimated plays left" value={String(remainingPlays)} />
          <StatRow label="Total plays (all-time)" value={String(profile.totalPlays)} />
        </Card>
        <Card eyebrow="SUPPORT PANEL">
          <p className="text-lg mb-3">
            Supporting <b className="text-purple">{profile.supportedArtists.length} artists</b> so far
            {topArtist && (
              <>
                , most of all <b className="text-purple">{topArtist.artist}</b> ({topArtist.plays} plays)
              </>
            )}
            .
          </p>
        </Card>
      </div>

      <h2 className="font-display text-sm mb-6">LISTENING ANALYTICS</h2>
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <Card eyebrow="DAILY PLAY TREND">
          <ListeningTrendChart data={profile.playsByDay} />
        </Card>
        <Card eyebrow="TOP ARTISTS">
          <TopArtistsChart data={profile.supportedArtists} />
        </Card>
      </div>

      <h2 className="font-display text-sm mb-6">ARTISTS SUPPORTED</h2>
      {profile.supportedArtists.length === 0 && <p className="text-dim text-lg">No listening history yet.</p>}
      <div className="grid md:grid-cols-3 gap-6">
        {profile.supportedArtists.map((a) => (
          <Card key={a.artist} title={a.artist.toUpperCase()}>
            <StatRow label="Plays" value={String(a.plays)} accent />
          </Card>
        ))}
      </div>
    </main>
  );
}
