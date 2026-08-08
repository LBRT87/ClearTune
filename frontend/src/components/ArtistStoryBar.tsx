"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { PixelAvatar } from "@/components/ui/PixelAvatar";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { PixelLoader } from "@/components/ui/PixelLoader";

type SupportedArtist = { artist: string; plays: number };

export function ArtistStoryBar() {
  const { address, isConnected } = useAccount();
  const [artists, setArtists] = useState<SupportedArtist[] | null>(null);
  const [active, setActive] = useState<SupportedArtist | null>(null);

  useEffect(() => {
    if (!address) {
      setArtists(null);
      return;
    }
    let cancelled = false;
    setArtists(null);
    fetch(`/api/listener/${address}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setArtists(data.supportedArtists ?? []);
      })
      .catch(() => {
        if (!cancelled) setArtists([]);
      });
    return () => {
      cancelled = true;
    };
  }, [address]);

  return (
    <section className="mb-10">
      <span className="text-dim font-display text-[10px] block mb-4">ARTIS YANG KAMU DUKUNG</span>

      {!isConnected && (
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <button onClick={openConnectModal} type="button" className="flex flex-col items-center gap-2">
              <span className="story-bubble story-bubble-empty">
                <span className="w-10 h-10 flex items-center justify-center bg-void text-dim">
                  <PixelIcon name="plus" size={20} />
                </span>
              </span>
              <span className="font-display text-[9px] text-dim">CONNECT</span>
            </button>
          )}
        </ConnectButton.Custom>
      )}

      {isConnected && artists === null && <PixelLoader label="MEMUAT ARTIS" />}

      {isConnected && artists !== null && artists.length === 0 && (
        <p className="text-dim text-lg">Belum ada artis yang kamu dukung — putar lagu di katalog untuk mulai.</p>
      )}

      {isConnected && artists !== null && artists.length > 0 && (
        <div className="flex gap-5 overflow-x-auto pb-2">
          {artists.map((a) => (
            <button
              key={a.artist}
              type="button"
              onClick={() => setActive(a)}
              className="flex flex-col items-center gap-2 shrink-0"
            >
              <span className="story-bubble">
                <PixelAvatar seed={a.artist} size={40} />
              </span>
              <span className="font-display text-[9px] max-w-[64px] truncate">{a.artist}</span>
            </button>
          ))}
        </div>
      )}

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/85 px-4" onClick={() => setActive(null)}>
          <div className="card max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-5">
              <span className="story-bubble">
                <PixelAvatar seed={active.artist} size={56} />
              </span>
              <button type="button" onClick={() => setActive(null)} aria-label="Tutup" className="text-dim hover:text-ink">
                <PixelIcon name="close" size={16} />
              </button>
            </div>
            <h3 className="font-display text-sm mb-4">{active.artist.toUpperCase()}</h3>
            <div className="stat-row">
              <span className="text-dim text-lg">Play kamu ke artis ini</span>
              <span className="font-display text-[11px] text-purple">{active.plays}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
