"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { getPlaylistsByOwner, type Playlist } from "@/lib/playlists";
import { uploadCover } from "@/lib/uploadCover";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusLine } from "@/components/ui/StatusLine";
import { PixelCover } from "@/components/ui/PixelCover";

export function PlaylistManager() {
  const { address, isConnected } = useAccount();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [name, setName] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (address) getPlaylistsByOwner(address).then(setPlaylists);
  }, [address]);

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
    return <StatusLine variant="info" label="HUBUNGKAN DOMPET" detail="Sambungkan dompet untuk melihat playlist kamu." />;
  }

  return (
    <div>
      <Card eyebrow="BUAT PLAYLIST BARU" className="mb-10 max-w-[480px]">
        <form onSubmit={createPlaylist} className="flex flex-col gap-3">
          <div className="flex gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Nama playlist"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-void border-[3px] border-ink text-ink font-mono text-lg px-3 py-2 flex-1 min-w-[180px]"
            />
            <Button type="submit" variant="purple" disabled={creating || !name.trim()}>
              {creating ? "MEMBUAT..." : "BUAT"}
            </Button>
          </div>
          <div className="field mb-0">
            <label>COVER (OPSIONAL)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              className="text-lg"
            />
          </div>
        </form>
      </Card>

      {playlists.length === 0 && <p className="text-dim text-lg">Belum ada playlist. Buat satu di atas.</p>}
      <div className="grid md:grid-cols-3 gap-6">
        {playlists.map((p) => (
          <Link key={p.id} href={`/playlist/${p.id}`} className="media-card">
            <div className="media-cover">
              <PixelCover seed={`playlist-${p.id}-${p.name}`} src={p.cover_url} />
            </div>
            <div className="media-title">{p.name.toUpperCase()}</div>
            <div className="media-sub">{new Date(p.created_at).toLocaleDateString("id-ID")}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
