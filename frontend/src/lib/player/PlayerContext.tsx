"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import type { SongRow } from "@/lib/songs";

const STALL_S = 2.5;
const TICK_MS = 100;

export type AudioStatus = "loading" | "ready" | "missing";
export type ReportState = "idle" | "loading" | "done" | "error";

type PlayerContextValue = {
  queue: SongRow[];
  index: number;
  currentSong: SongRow | null;
  playing: boolean;
  currentTime: number;
  duration: number;
  audioStatus: AudioStatus;
  reportState: ReportState;
  txHash: string | null;
  hasNext: boolean;
  hasPrev: boolean;
  playSong: (song: SongRow, queue?: SongRow[]) => void;
  togglePlay: () => void;
  seekTo: (fraction: number) => void;
  next: () => void;
  prev: () => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { address } = useAccount();
  const audioRef = useRef<HTMLAudioElement>(null);

  const [queue, setQueue] = useState<SongRow[]>([]);
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioStatus, setAudioStatus] = useState<AudioStatus>("loading");
  const [reportState, setReportState] = useState<ReportState>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);

  const currentSong = index >= 0 && index < queue.length ? queue[index] : null;

  const reportedRef = useRef(false);
  const heardRef = useRef(0);
  const lastRef = useRef(0);
  const lastWallRef = useRef(0);
  const stallRef = useRef(0);

  const reportPlay = useCallback(
    async (songId: number) => {
      if (!address || reportedRef.current) return;
      reportedRef.current = true;
      setReportState("loading");
      try {
        const res = await fetch("/api/reportPlays", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listener: address, songId, completed: true }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "failed to report play");
        setTxHash(json.txHash);
        setReportState("done");
      } catch {
        reportedRef.current = false;
        setReportState("error");
      }
    },
    [address],
  );

  const playSong = useCallback((song: SongRow, newQueue?: SongRow[]) => {
    const q = newQueue && newQueue.length > 0 ? newQueue : [song];
    const i = q.findIndex((s) => s.song_id_onchain === song.song_id_onchain);
    setQueue(q);
    setIndex(i >= 0 ? i : 0);
    reportedRef.current = false;
    heardRef.current = 0;
    setReportState("idle");
    setTxHash(null);
    setPlaying(true);
  }, []);

  const next = useCallback(() => {
    setIndex((i) => {
      if (i < 0 || i + 1 >= queue.length) return i;
      reportedRef.current = false;
      heardRef.current = 0;
      setReportState("idle");
      setTxHash(null);
      setPlaying(true);
      return i + 1;
    });
  }, [queue.length]);

  const prev = useCallback(() => {
    const a = audioRef.current;
    if (a && a.currentTime > 3) {
      a.currentTime = 0;
      return;
    }
    setIndex((i) => {
      if (i <= 0) return i;
      reportedRef.current = false;
      heardRef.current = 0;
      setReportState("idle");
      setTxHash(null);
      setPlaying(true);
      return i - 1;
    });
  }, []);

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (!a || audioStatus === "missing") return;
    if (a.paused) void a.play().catch(() => setAudioStatus("missing"));
    else a.pause();
  }, [audioStatus]);

  const seekTo = useCallback((fraction: number) => {
    const a = audioRef.current;
    if (!a || !Number.isFinite(a.duration) || a.duration <= 0) return;
    a.currentTime = Math.max(0, Math.min(1, fraction)) * a.duration;
  }, []);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !currentSong) return;
    setAudioStatus("loading");
    setCurrentTime(0);
    setDuration(0);
    a.src = currentSong.storage_url;
    a.load();
    if (playing) void a.play().catch(() => setAudioStatus("missing"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSong?.song_id_onchain]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const onMeta = () => {
      setDuration(Number.isFinite(a.duration) ? a.duration : 0);
      setAudioStatus("ready");
    };
    const onErr = () => {
      setAudioStatus("missing");
      setPlaying(false);
    };
    const onPlay = () => {
      stallRef.current = 0;
      setPlaying(true);
    };
    const onPause = () => setPlaying(false);
    const onEnded = () => next();

    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("error", onErr);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnded);
    if (a.readyState >= 1) onMeta();

    return () => {
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("error", onErr);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnded);
    };
  }, [next]);

  useEffect(() => {
    if (!playing || !currentSong) return;
    const a = audioRef.current;
    if (!a) return;

    lastRef.current = a.currentTime;
    lastWallRef.current = performance.now();
    const songId = currentSong.song_id_onchain;

    const id = setInterval(() => {
      const t = a.currentTime;
      const now = performance.now();
      const played = t - lastRef.current;
      const wall = (now - lastWallRef.current) / 1000;
      lastRef.current = t;
      lastWallRef.current = now;
      setCurrentTime(t);

      if (played <= 0) {
        stallRef.current += wall;
        if (stallRef.current >= STALL_S && a.readyState === 0) {
          setAudioStatus("missing");
          a.pause();
        }
        return;
      }
      stallRef.current = 0;

      const dt = Math.min(played, wall);
      const before = heardRef.current;
      const after = before + dt;
      heardRef.current = after;

      const threshold = a.duration > 0 ? a.duration / 2 : Infinity;
      if (before < threshold && after >= threshold) {
        reportPlay(songId);
      }
    }, TICK_MS);

    return () => clearInterval(id);
  }, [playing, currentSong, reportPlay]);

  const value: PlayerContextValue = {
    queue,
    index,
    currentSong,
    playing,
    currentTime,
    duration,
    audioStatus,
    reportState,
    txHash,
    hasNext: index >= 0 && index + 1 < queue.length,
    hasPrev: index > 0,
    playSong,
    togglePlay,
    seekTo,
    next,
    prev,
  };

  return (
    <PlayerContext.Provider value={value}>
      <audio ref={audioRef} preload="metadata" />
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within a PlayerProvider");
  return ctx;
}
