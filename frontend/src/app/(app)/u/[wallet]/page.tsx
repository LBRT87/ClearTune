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

  const capReached = profile.playsThisMonth >= profile.playCap;
  const topArtist = profile.supportedArtists[0];

  return (
    <main className="max-w-[1040px] mx-auto px-5 py-12">
      <span className="text-dim font-display text-[10px] block mb-4">PROFIL PENDENGAR</span>
      <h1 className="font-display text-lg mb-2 break-all">{short(wallet)}</h1>
      <p className="text-dim text-lg mb-8 break-all">{wallet}</p>

      <div className="flex gap-3 flex-wrap mb-10">
        <Tag variant={capReached ? "yellow" : "green"}>{capReached ? "MODE GRATIS AKTIF" : "AKTIF DI BAWAH CAP"}</Tag>
        <Tag variant={profile.autoRefillEnabled ? "purple" : "neutral"}>
          {profile.autoRefillEnabled ? "AUTO-REFILL ON" : "AUTO-REFILL OFF"}
        </Tag>
        {profile.trustScore !== null && (
          <Tag variant={profile.trustScore >= 0.6 ? "green" : profile.trustScore >= 0.3 ? "yellow" : "red"}>
            TRUST SCORE {(profile.trustScore * 100).toFixed(0)}%
          </Tag>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <Card eyebrow="STATUS KUOTA">
          <StatRow label="Play bulan ini" value={`${profile.playsThisMonth} / ${profile.playCap}`} />
          <StatRow label="Total play (sepanjang masa)" value={String(profile.totalPlays)} />
        </Card>
        <Card eyebrow="PANEL DUKUNGAN">
          <p className="text-lg mb-3">
            Bulan ini mendukung <b className="text-purple">{profile.supportedArtists.length} musisi</b>
            {topArtist && (
              <>
                , terbanyak <b className="text-purple">{topArtist.artist}</b> ({topArtist.plays} play)
              </>
            )}
            .
          </p>
        </Card>
      </div>

      <h2 className="font-display text-sm mb-6">ANALITIK DENGAR</h2>
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <Card eyebrow="TREN PLAY HARIAN">
          <ListeningTrendChart data={profile.playsByDay} />
        </Card>
        <Card eyebrow="TOP MUSISI">
          <TopArtistsChart data={profile.supportedArtists} />
        </Card>
      </div>

      <h2 className="font-display text-sm mb-6">MUSISI DIDUKUNG</h2>
      {profile.supportedArtists.length === 0 && <p className="text-dim text-lg">Belum ada riwayat dengar.</p>}
      <div className="grid md:grid-cols-3 gap-6">
        {profile.supportedArtists.map((a) => (
          <Card key={a.artist} title={a.artist.toUpperCase()}>
            <StatRow label="Play" value={String(a.plays)} accent />
          </Card>
        ))}
      </div>
    </main>
  );
}
