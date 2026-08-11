"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePlayer } from "@/lib/player/PlayerContext";
import { PixelCover } from "@/components/ui/PixelCover";
import { PixelIcon } from "@/components/ui/PixelIcon";

function mmss(s: number) {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function GlobalPlayerBar() {
  const { currentSong, playing, currentTime, duration, audioStatus, hasNext, hasPrev, togglePlay, seekTo, next, prev } =
    usePlayer();
  const barRef = useRef<HTMLDivElement>(null);

  if (!currentSong) return null;

  const filled = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  function handleSeekClick(e: React.MouseEvent<HTMLDivElement>) {
    const bar = barRef.current;
    if (!bar || duration <= 0) return;
    const rect = bar.getBoundingClientRect();
    const fraction = (e.clientX - rect.left) / rect.width;
    seekTo(fraction);
  }

  return (
    <div className="global-player-bar">
      <div className="global-player-inner">
        <Link
          href={`/song/${currentSong.song_id_onchain}`}
          className="global-player-track flex items-center gap-3 min-w-0"
        >
          <div className="global-player-cover cover-frame shrink-0">
            <PixelCover seed={`song-${currentSong.song_id_onchain}-${currentSong.title}`} src={currentSong.cover_url} />
          </div>
          <div className="min-w-0">
            <div className="font-display text-[10px] truncate">{currentSong.title.toUpperCase()}</div>
            <div className="text-dim text-base truncate">{currentSong.artist}</div>
          </div>
        </Link>

        <div className="global-player-controls">
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={prev}
              disabled={!hasPrev}
              aria-label="Previous song"
              className="btn btn-outline !shadow-none !p-3 disabled:opacity-30"
            >
              <PixelIcon name="prev" size={14} />
            </button>
            <button
              type="button"
              onClick={togglePlay}
              disabled={audioStatus === "missing"}
              aria-label={playing ? "Pause" : "Play"}
              className="btn btn-purple !shadow-none !p-3 disabled:opacity-30"
            >
              <PixelIcon name={playing ? "pause" : "play"} size={14} />
            </button>
            <button
              type="button"
              onClick={next}
              disabled={!hasNext}
              aria-label="Next song"
              className="btn btn-outline !shadow-none !p-3 disabled:opacity-30"
            >
              <PixelIcon name="next" size={14} />
            </button>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-dim text-base w-12 text-right shrink-0">{mmss(currentTime)}</span>
            <div ref={barRef} className="usage-bar flex-1 cursor-pointer" onClick={handleSeekClick}>
              <div className="usage-bar-fill" style={{ width: `${filled}%`, background: "#8b5cf6" }} />
            </div>
            <span className="text-dim text-base w-12 shrink-0">{duration > 0 ? mmss(duration) : "--:--"}</span>
          </div>
        </div>

        <div className="global-player-spacer hidden md:block" />
      </div>
      {audioStatus === "missing" && (
        <div className="text-center text-base" style={{ color: "#ff5c5c" }}>
          Audio couldn&apos;t load for this song.
        </div>
      )}
    </div>
  );
}
