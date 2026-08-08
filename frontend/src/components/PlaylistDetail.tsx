"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAccount } from "wagmi";
import type { Playlist } from "@/lib/playlists";
import type { SongRow } from "@/lib/songs";
import { Button } from "@/components/ui/Button";
import { Card, StatRow } from "@/components/ui/Card";

function short(wallet: string) {
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

export function PlaylistDetail({ playlist, songs }: { playlist: Playlist; songs: SongRow[] }) {
  const { address } = useAccount();
  const router = useRouter();
  const isOwner = !!address && address.toLowerCase() === playlist.owner_wallet.toLowerCase();

  async function removeSong(songId: number) {
    await fetch(`/api/playlists/${playlist.id}/songs?songId=${songId}`, { method: "DELETE" });
    router.refresh();
  }

  async function deletePlaylist() {
    await fetch(`/api/playlists/${playlist.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerWallet: address }),
    });
    router.push("/playlists");
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <span className="text-dim font-display text-[10px] block mb-3">
            PLAYLIST BY{" "}
            <Link href={`/u/${playlist.owner_wallet}`} className="text-purple hover:underline">
              {short(playlist.owner_wallet)}
            </Link>
          </span>
          <h1 className="font-display text-xl">{playlist.name.toUpperCase()}</h1>
        </div>
        {isOwner && (
          <Button variant="danger" onClick={deletePlaylist}>
            DELETE PLAYLIST
          </Button>
        )}
      </div>

      {songs.length === 0 && <p className="text-dim text-lg">No songs in this playlist yet.</p>}
      <div className="grid md:grid-cols-3 gap-6">
        {songs.map((song) => (
          <Card key={song.song_id_onchain} eyebrow={`SONG #${song.song_id_onchain}`} title={song.title.toUpperCase()}>
            <StatRow label="Artist" value={song.artist} />
            <div className="flex gap-3 mt-4">
              <Link href={`/song/${song.song_id_onchain}`}>
                <Button variant="outline">PLAY</Button>
              </Link>
              {isOwner && (
                <Button variant="danger" onClick={() => removeSong(song.song_id_onchain)}>
                  REMOVE
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
