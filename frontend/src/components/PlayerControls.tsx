"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/Button";
import { StatusLine } from "@/components/ui/StatusLine";

const EXPLORER_URL = process.env.NEXT_PUBLIC_MONAD_EXPLORER_URL ?? "https://testnet.monadexplorer.com";

/* Berapa detik boleh "memutar" tanpa currentTime bertambah sebelum elemen
   audio dianggap tidak bisa dipercaya lagi (file tidak ada / rusak). */
const STALL_S = 2.5;
const TICK_MS = 100;

function mmss(s: number) {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

type AudioStatus = "loading" | "ready" | "missing";
type ReportState = "idle" | "loading" | "done" | "error";

export function PlayerControls({ songId, storageUrl }: { songId: number; storageUrl: string }) {
  const { address, isConnected } = useAccount();
  const audioRef = useRef<HTMLAudioElement>(null);

  const [audioStatus, setAudioStatus] = useState<AudioStatus>("loading");
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);

  const [reportState, setReportState] = useState<ReportState>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const reportedRef = useRef(false);

  /* Akumulasi detik terdengar dipegang di ref supaya bisa dibaca sinkron di
     dalam interval, bukan lewat state yang tertunda satu render. */
  const heardRef = useRef(0);
  const lastRef = useRef(0);
  const lastWallRef = useRef(0);
  const stallRef = useRef(0);

  /* Satu playthrough = satu play, dipicu otomatis begitu lewat separuh
     durasi lagu — bukan menunggu tombol diklik. Kalau pendengar skip/pindah
     setelah titik ini, play tetap terhitung; kalau sebelum titik ini, tidak
     ada apa pun yang dikirim on-chain. */
  const reportPlay = useCallback(async () => {
    if (!address || reportedRef.current) return;
    reportedRef.current = true;
    setReportState("loading");
    setErrorMsg(null);
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
    } catch (err) {
      reportedRef.current = false;
      setErrorMsg(err instanceof Error ? err.message : "unknown error");
      setReportState("error");
    }
  }, [address, songId]);

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
    const onEnded = () => setPlaying(false);

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
  }, []);

  useEffect(() => {
    if (!playing) return;
    const a = audioRef.current;
    if (!a) return;

    lastRef.current = a.currentTime;
    lastWallRef.current = performance.now();

    const id = setInterval(() => {
      const t = a.currentTime;
      const now = performance.now();
      const played = t - lastRef.current;
      const wall = (now - lastWallRef.current) / 1000;
      lastRef.current = t;
      lastWallRef.current = now;
      setPos(t);

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
        reportPlay();
      }
    }, TICK_MS);

    return () => clearInterval(id);
  }, [playing, reportPlay]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a || audioStatus === "missing") return;
    if (a.paused) void a.play().catch(() => setAudioStatus("missing"));
    else a.pause();
  };

  if (!isConnected) {
    return <StatusLine variant="info" label="CONNECT WALLET" detail="Connect a wallet to play this song." />;
  }

  const filled = duration > 0 ? Math.min(100, (pos / duration) * 100) : 0;
  const threshold = duration > 0 ? duration / 2 : 0;

  return (
    <div>
      <audio ref={audioRef} src={storageUrl} preload="metadata" />

      <div className="flex items-center gap-4 mb-3">
        <Button variant="purple" onClick={toggle} disabled={audioStatus === "missing"}>
          {playing ? "PAUSE" : "PLAY SONG"}
        </Button>
        <span className="text-dim text-lg">
          {mmss(pos)} / {duration > 0 ? mmss(duration) : "--:--"}
        </span>
      </div>

      <div className="usage-bar mb-2">
        <div className="usage-bar-fill" style={{ width: `${filled}%`, background: "#8b5cf6" }} />
      </div>
      <p className="text-dim text-base mb-5">
        Play is recorded on-chain automatically once {mmss(threshold)} (half the song) has been
        heard — nothing to click.
      </p>

      {audioStatus === "missing" && (
        <StatusLine variant="err" label="AUDIO COULDN'T LOAD" detail="File not found at its source." />
      )}
      {reportState === "loading" && <StatusLine variant="info" label="RECORDING PLAY ON-CHAIN..." />}
      {reportState === "done" && txHash && (
        <>
          <StatusLine
            variant="ok"
            label="PLAY RECORDED ON-CHAIN"
            detail={`tx: ${txHash.slice(0, 10)}...${txHash.slice(-6)}`}
          />
          <a
            className="text-purple underline text-lg mt-2 inline-block"
            href={`${EXPLORER_URL}/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
          >
            View on block explorer →
          </a>
        </>
      )}
      {reportState === "error" && <StatusLine variant="err" label="FAILED TO RECORD PLAY" detail={errorMsg ?? undefined} />}
    </div>
  );
}
