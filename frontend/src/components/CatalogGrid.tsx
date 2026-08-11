"use client";

import Link from "next/link";
import { usePlayer } from "@/lib/player/PlayerContext";
import { Card, StatRow } from "@/components/ui/Card";
import { PixelCover } from "@/components/ui/PixelCover";
import { PixelIcon } from "@/components/ui/PixelIcon";
import type { SongRow } from "@/lib/songs";

export function CatalogGrid({ songs }: { songs: SongRow[] }) {
  const { playSong } = usePlayer();

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {songs.map((song) => (
        <Link
          key={song.song_id_onchain}
          href={`/song/${song.song_id_onchain}`}
          className="block cover-hover"
          onClick={() => playSong(song, songs)}
        >
          <div className="cover-frame aspect-square mb-3">
            <PixelCover seed={`song-${song.song_id_onchain}-${song.title}`} src={song.cover_url} />
            <span className="cover-play">
              <PixelIcon name="play" size={18} />
            </span>
          </div>
          <Card eyebrow={`SONG #${String(song.song_id_onchain).padStart(4, "0")}`} title={song.title.toUpperCase()}>
            <StatRow label="Artist" value={song.artist} />
            <StatRow
              label="Duration"
              value={song.duration ? `${Math.floor(song.duration / 60)}:${String(song.duration % 60).padStart(2, "0")}` : "—"}
            />
          </Card>
        </Link>
      ))}
    </div>
  );
}
