import { getSongs } from "@/lib/songs";
import { BalanceStatusBanner } from "@/components/BalanceStatusBanner";
import { CatalogGrid } from "@/components/CatalogGrid";

export default async function CatalogPage() {
  const songs = await getSongs();

  return (
    <main className="max-w-[1040px] mx-auto px-5 py-12">
      <h1 className="font-display text-xl mb-8">CATALOG</h1>
      <BalanceStatusBanner />
      <CatalogGrid songs={songs} />
    </main>
  );
}
