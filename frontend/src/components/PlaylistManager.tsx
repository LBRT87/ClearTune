"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { getPlaylistsByOwner, getPlaylistArtists, formatArtistList, type Playlist } from "@/lib/playlists";
import { uploadCover } from "@/lib/uploadCover";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusLine } from "@/components/ui/StatusLine";
import { PixelCover } from "@/components/ui/PixelCover";
import { PixelIcon } from "@/components/ui/PixelIcon";

export function PlaylistManager() {
  const { address, isConnected } = useAccount();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistArtists, setPlaylistArtists] = useState<Record<number, string[]>>({});
  const [name, setName] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (address) getPlaylistsByOwner(address).then(setPlaylists);
  }, [address]);

  useEffect(() => {
    if (playlists.length === 0) return;
    let cancelled = false;
    Promise.all(playlists.map((p) => getPlaylistArtists(p.id).then((artists) => [p.id, artists] as const))).then(
      (entries) => {
        if (!cancelled) setPlaylistArtists(Object.fromEntries(entries));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [playlists]);

  async function createPlaylist(e: React.FormEvent) {
    e.preventDefault();
    if (!address || !name.trim()) return;
    setCreating(true);
    const coverUrl = coverFile ? await uploadCover(coverFile) : null;
    const res = await fetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerWallet: address, name: name.trim(), coverUrl }),
    });
    if (res.ok) {
      setName("");
      setCoverFile(null);
      setPlaylists(await getPlaylistsByOwner(address));
    }
    setCreating(false);
  }

  if (!isConnected) {
    return <StatusLine variant="info" label="CONNECT WALLET" detail="Connect a wallet to see your playlists." />;
  }

  return (
    <div>
      <Card eyebrow="CREATE NEW PLAYLIST" className="mb-10 max-w-[480px]">
        <form onSubmit={createPlaylist} className="flex flex-col gap-3">
          <div className="flex gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Playlist name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-void border-[3px] border-ink text-ink font-mono text-lg px-3 py-2 flex-1 min-w-[180px]"
            />
            <Button type="submit" variant="purple" disabled={creating || !name.trim()}>
              {creating ? "CREATING..." : "CREATE"}
            </Button>
          </div>
          <div className="field mb-0">
            <label>COVER (OPTIONAL)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              className="text-lg"
            />
          </div>
        </form>
      </Card>

      {playlists.length === 0 && <p className="text-dim text-lg">No playlists yet. Create one above.</p>}
      <div className="grid md:grid-cols-3 gap-6">
        {playlists.map((p) => (
          <Link key={p.id} href={`/playlist/${p.id}`} className="media-card">
            <div className="media-cover cover-frame">
              <PixelCover seed={`playlist-${p.id}-${p.name}`} src={p.cover_url} />
              <span className="cover-play">
                <PixelIcon name="play" size={18} />
              </span>
            </div>
            <div className="media-title">{p.name.toUpperCase()}</div>
            <div className="media-sub line-clamp-2">
              {formatArtistList(playlistArtists[p.id] ?? []) ?? new Date(p.created_at).toLocaleDateString("en-US")}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
