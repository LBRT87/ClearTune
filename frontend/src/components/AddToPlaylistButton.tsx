"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { getPlaylistsByOwner, type Playlist } from "@/lib/playlists";
import { Button } from "@/components/ui/Button";
import { StatusLine } from "@/components/ui/StatusLine";

export function AddToPlaylistButton({ songId }: { songId: number }) {
  const { address, isConnected } = useAccount();
  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [newName, setNewName] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open && address) {
      getPlaylistsByOwner(address).then(setPlaylists);
    }
  }, [open, address]);

  async function addToPlaylist(playlistId: number) {
    setStatus("busy");
    try {
      const res = await fetch(`/api/playlists/${playlistId}/songs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "failed to add");
      setStatus("done");
      setMessage("Added to playlist.");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "failed");
    }
  }

  async function createAndAdd() {
    if (!address || !newName.trim()) return;
    setStatus("busy");
    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerWallet: address, name: newName.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "failed to create playlist");
      await addToPlaylist(json.id);
      setNewName("");
      setPlaylists(await getPlaylistsByOwner(address));
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "failed");
    }
  }

  if (!isConnected) {
    return <StatusLine variant="info" label="CONNECT WALLET" detail="Connect a wallet to save to a playlist." />;
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        + ADD TO PLAYLIST
      </Button>
    );
  }

  return (
    <div>
      {playlists.length > 0 && (
        <div className="flex flex-col gap-3 mb-4">
          {playlists.map((p) => (
            <Button key={p.id} variant="outline" onClick={() => addToPlaylist(p.id)} disabled={status === "busy"}>
              {p.name.toUpperCase()}
            </Button>
          ))}
        </div>
      )}
      <div className="flex gap-3 items-center flex-wrap">
        <input
          type="text"
          placeholder="New playlist name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="bg-void border-[3px] border-ink text-ink font-mono text-lg px-3 py-2 flex-1 min-w-[180px]"
        />
        <Button variant="purple" onClick={createAndAdd} disabled={status === "busy" || !newName.trim()}>
          CREATE + ADD
        </Button>
      </div>
      {status === "done" && (
        <div className="mt-4">
          <StatusLine variant="ok" label="SAVED" detail={message ?? undefined} />
        </div>
      )}
      {status === "error" && (
        <div className="mt-4">
          <StatusLine variant="err" label="FAILED" detail={message ?? undefined} />
        </div>
      )}
    </div>
  );
}
