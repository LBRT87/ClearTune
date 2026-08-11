"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useConnectPrompt } from "@/components/ui/WalletControls";
import { usePlayer } from "@/lib/player/PlayerContext";
import { getSongs, type SongRow } from "@/lib/songs";
import { getPlaylistsByOwner, getPlaylistArtists, formatArtistList, type Playlist } from "@/lib/playlists";
import { PixelCover } from "@/components/ui/PixelCover";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { PixelLoader } from "@/components/ui/PixelLoader";
import { ArtistStoryBar } from "@/components/ArtistStoryBar";
import { GlobalSearch } from "@/components/ui/GlobalSearch";
import { useHomeFilter } from "@/lib/useHomeFilter";

export default function HomePage() {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectPrompt();
  const { playSong } = usePlayer();
  const [songs, setSongs] = useState<SongRow[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[] | null>(null);
  const [playlistArtists, setPlaylistArtists] = useState<Record<number, string[]>>({});
  const { filter, setFilter } = useHomeFilter();

  useEffect(() => {
    getSongs().then(setSongs);
  }, []);

  useEffect(() => {
    if (!address) {
      setPlaylists(null);
      return;
    }
    getPlaylistsByOwner(address).then(setPlaylists);
  }, [address]);

  useEffect(() => {
    if (!playlists || playlists.length === 0) return;
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

  const showPlaylists = filter !== "songs";
  const showSongs = filter !== "playlists";

  return (
    <main className="max-w-[1200px] mx-auto px-6 py-10">
      <ArtistStoryBar />

      {/* Search lives in TopBar on desktop (same row as BROWSE/wallet) — but
          TopBar is desktop-only, so mobile gets its own copy here. */}
      <GlobalSearch className="md:hidden mb-6" />

      {/* Filter pills — deliberately NOT in TopBar: sits a little below the
          search bar, sticky right under the 84px top bar as the feed
          scrolls (not merged into the fixed bar itself). */}
      <div className="md:sticky md:top-[84px] z-10 bg-void pt-1 pb-6 -mx-6 px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`filter-pill ${filter === "all" ? "filter-pill-active" : ""}`}
          >
            ALL
          </button>
          <button
            type="button"
            onClick={() => setFilter("playlists")}
            className={`filter-pill ${filter === "playlists" ? "filter-pill-active" : ""}`}
          >
            PLAYLISTS
          </button>
          <button
            type="button"
            onClick={() => setFilter("songs")}
            className={`filter-pill ${filter === "songs" ? "filter-pill-active" : ""}`}
          >
            SONGS
          </button>
        </div>
      </div>

      {showPlaylists && (
        <section className="mb-14">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-display text-sm">YOUR PLAYLISTS</h2>
            <Link href="/playlists" className="text-dim font-display text-[9px] hover:text-purple">
              SHOW ALL
            </Link>
          </div>

          {!isConnected && (
            <button type="button" onClick={openConnectModal} className="media-card">
              <div className="media-cover cover-frame flex items-center justify-center bg-void">
                <PixelIcon name="plus" size={40} className="text-dim" />
              </div>
              <div className="media-title text-dim">LOG IN</div>
              <div className="media-sub">to see your playlists</div>
            </button>
          )}

          {isConnected && playlists === null && <PixelLoader label="LOADING PLAYLISTS" />}

          {isConnected && playlists !== null && playlists.length === 0 && (
            <p className="text-dim text-lg">
              No playlists yet.{" "}
              <Link href="/playlists" className="text-purple underline">
                Create one
              </Link>
              .
            </p>
          )}

          {isConnected && playlists && playlists.length > 0 && (
            <div className="media-row">
              {playlists.map((p, i) => (
                <Link key={p.id} href={`/playlist/${p.id}`} className="media-card">
                  <div className="media-cover cover-frame">
                    <PixelCover seed={`playlist-${p.id}-${p.name}`} src={p.cover_url} />
                    <span className="media-badge">MIX {String(i + 1).padStart(2, "0")}</span>
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
          )}
        </section>
      )}

      {showSongs && (
        <section>
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-display text-sm">SONGS IN THE CATALOG</h2>
            <Link href="/catalog" className="text-dim font-display text-[9px] hover:text-purple">
              SHOW ALL
            </Link>
          </div>

          {songs.length === 0 && <PixelLoader label="LOADING SONGS" />}

          {songs.length > 0 && (
            <div className="media-row">
              {songs.map((s) => (
                <Link
                  key={s.song_id_onchain}
                  href={`/song/${s.song_id_onchain}`}
                  className="media-card"
                  onClick={() => playSong(s, songs)}
                >
                  <div className="media-cover cover-frame">
                    <PixelCover seed={`song-${s.song_id_onchain}-${s.title}`} src={s.cover_url} />
                    <span className="cover-play">
                      <PixelIcon name="play" size={18} />
                    </span>
                  </div>
                  <div className="media-title">{s.title.toUpperCase()}</div>
                  <div className="media-sub">{s.artist}</div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
