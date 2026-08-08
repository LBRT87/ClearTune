import { notFound } from "next/navigation";
import { getPlaylist, getPlaylistSongs } from "@/lib/playlists";
import { PlaylistDetail } from "@/components/PlaylistDetail";

export default async function PlaylistPage({ params }: { params: { id: string } }) {
  const playlist = await getPlaylist(Number(params.id));
  if (!playlist) notFound();

  const songs = await getPlaylistSongs(playlist.id);

  return (
    <main className="max-w-[1040px] mx-auto px-5 py-12">
      <PlaylistDetail playlist={playlist} songs={songs} />
    </main>
  );
}
