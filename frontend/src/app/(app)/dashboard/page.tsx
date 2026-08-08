import { getSongs } from "@/lib/songs";
import { ArtistDashboard } from "@/components/ArtistDashboard";

export default async function DashboardPage() {
  const songs = await getSongs();
  return (
    <main className="max-w-[1040px] mx-auto px-5 py-12">
      <h1 className="font-display text-xl mb-8">DASHBOARD MUSISI</h1>
      <ArtistDashboard songs={songs} />
    </main>
  );
}
