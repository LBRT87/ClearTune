import { formatUnits } from "viem";
import { getArtistProfile } from "@/lib/artistProfile";
import { Card, StatRow } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";

function short(wallet: string) {
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

export default async function ArtistProfilePage({ params }: { params: { wallet: string } }) {
  const wallet = params.wallet as `0x${string}`;
  const profile = await getArtistProfile(wallet);

  return (
    <main className="max-w-[1040px] mx-auto px-5 py-12">
      <span className="text-dim font-display text-[10px] block mb-4">PROFIL MUSISI</span>
      <h1 className="font-display text-lg mb-2 break-all">{short(wallet)}</h1>
      <p className="text-dim text-lg mb-8 break-all">{wallet}</p>

      <div className="mb-10">
        <Tag variant="purple">TERVERIFIKASI ON-CHAIN</Tag>
        <Tag variant="solid">{profile.songs.length} LAGU TERDAFTAR</Tag>
      </div>

      <Card eyebrow="TRANSPARANSI ROYALTI" className="mb-10 max-w-none">
        <StatRow label="Total dapat ditarik saat ini" value={`${formatUnits(profile.earned, 6)} mUSD`} accent />
        <p className="text-dim text-lg mt-3">
          Angka ini dibaca langsung dari kontrak on-chain — bukan laporan internal platform.
        </p>
      </Card>

      <h2 className="font-display text-sm mb-6">LAGU</h2>
      {profile.songs.length === 0 && <p className="text-dim text-lg">Belum ada lagu terdaftar dengan dompet ini.</p>}
      <div className="grid md:grid-cols-3 gap-6">
        {profile.songs.map((s) => (
          <Card key={s.song_id_onchain} eyebrow={`LAGU #${s.song_id_onchain}`} title={s.title.toUpperCase()}>
            <StatRow label="Play total" value={String(s.totalPlays)} />
            <StatRow label="Dari subscription" value={String(s.subscriptionPlays)} />
            <StatRow label="Dari treasury" value={String(s.treasuryPlays)} accent />
          </Card>
        ))}
      </div>
    </main>
  );
}
