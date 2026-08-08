import { PlaylistManager } from "@/components/PlaylistManager";

export default function PlaylistsPage() {
  return (
    <main className="max-w-[1040px] mx-auto px-5 py-12">
      <h1 className="font-display text-xl mb-8">PLAYLIST SAYA</h1>
      <PlaylistManager />
    </main>
  );
}
