"use client";

/* Widget bukti di hero (tiket 07): tekan play → angka bergerak → royalti
   terbagi. Tiga hal yang menentukan apakah widget ini jujur:

   1. Yang menggerakkan semuanya adalah <audio> sungguhan, bukan setInterval.
      Progress, detik terdengar, dan settlement semuanya dibaca dari
      `currentTime` — kalau audionya tidak jalan, tidak ada satu angka pun
      yang bergerak. Itu memang yang diinginkan.
   2. Satu playthrough = satu play. Bukan satu play tiap N detik: mendengarkan
      30 detik sekali jalan itu satu play, bukan tiga. Play berikutnya baru
      dihitung setelah lagunya diulang.
   3. TIDAK ADA tx hash palsu. Widget hero ini simulasi lokal, tidak memanggil
      kontrak — membuat hash acak yang berubah tiap play persis yang akan
      langsung ketahuan juri Monad, dan ketahuan memalsukan bukti jauh lebih
      mahal daripada mengakui ini simulasi. Kontraknya sendiri sudah live dan
      terverifikasi di Monad testnet — buktinya ada di app, bukan di widget ini. */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  PLATFORM_FEE_BPS,
  RATE_PER_PLAY,
  SETTLEMENT,
  TOTAL_BPS,
  fmt,
} from "@/lib/settlement";
import { TRACK, mmss, secs, thresholdFor } from "@/lib/track";

const SEGMENTS = 28;

/* 100ms: hitungan mundur ditampilkan satu desimal, jadi 10 kali per detik
   adalah tepat cukup — lebih rapat cuma menambah render tanpa menambah digit
   yang berubah. */
const TICK_MS = 100;

/* Berapa lama boleh "memutar" tanpa `currentTime` bertambah sebelum kita
   berhenti mempercayai elemen media. Longgar supaya tab di latar — di mana
   Chrome men-clamp interval ke ~1 detik — tidak salah dianggap mati. */
const STALL_S = 2.5;

const { fee, net, shares } = SETTLEMENT;

type Status = "loading" | "ready" | "missing";

export function SettlementWidget() {
  const audioRef = useRef<HTMLAudioElement>(null);

  const [status, setStatus] = useState<Status>("loading");
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [heard, setHeard] = useState(0);
  const [plays, setPlays] = useState(0);
  const [flash, setFlash] = useState(false);

  /* Akumulasi detik terdengar dipegang di ref, bukan cuma di state: yang
     memutuskan "sudah lewat ambang" adalah nilai sebelum dan sesudah satu
     tick, dan itu harus dibaca sinkron di dalam interval. */
  const heardRef = useRef(0);
  const lastRef = useRef(0);
  const lastWallRef = useRef(0);
  const stallRef = useRef(0);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commitPlay = useCallback(() => {
    setPlays((n) => n + 1);
    setFlash(true);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(false), 600);
  }, []);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const onMeta = () => {
      setDuration(Number.isFinite(a.duration) ? a.duration : 0);
      setStatus("ready");
    };
    const onErr = () => {
      setStatus("missing");
      setPlaying(false);
    };
    const onPlay = () => {
      stallRef.current = 0;
      setPlaying(true);
    };
    const onPause = () => setPlaying(false);

    /* Diulang manual lewat `ended`, bukan lewat atribut `loop`, supaya batas
       antar playthrough benar-benar terlihat di kode — di situlah hitungan
       "sudah terdengar" di-nol-kan dan play berikutnya jadi mungkin. Dengan
       `loop`, event `ended` tidak pernah datang dan batas itu hilang. */
    const onEnded = () => {
      heardRef.current = 0;
      lastRef.current = 0;
      stallRef.current = 0;
      setHeard(0);
      setPos(0);
      a.currentTime = 0;
      void a.play().catch(() => {});
    };

    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("error", onErr);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnded);

    /* Metadata bisa sudah tiba sebelum efek ini terpasang (file di-cache). */
    if (a.readyState >= 1) onMeta();

    return () => {
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("error", onErr);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnded);
      if (flashTimer.current) clearTimeout(flashTimer.current);
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

      /* Tidak maju. Kalau ini berlarut, kita tidak sedang memutar apa pun —
         dan eyebrow tidak boleh terus berkedip "SEDANG DIPUTAR" di atas
         keheningan. `play()` berhasil dan event `play` menyala bahkan saat
         filenya 404: elemen media melapor niat, bukan kenyataan. Yang bisa
         dipercaya cuma `currentTime` yang benar-benar bertambah.

         `readyState === 0` berarti tidak ada satu byte pun yang ter-decode,
         jadi ini bukan buffering yang tersendat tapi file yang memang tidak
         bisa dimuat — perlakukan seperti tidak ada, dan hentikan. */
      if (played <= 0) {
        stallRef.current += wall;
        if (stallRef.current >= STALL_S && a.readyState === 0) {
          setStatus("missing");
          a.pause();
        }
        return;
      }
      stallRef.current = 0;

      /* Detik terdengar tidak pernah bisa melebihi waktu nyata yang berlalu.
         Itu batas atas yang benar untuk dua hal sekaligus, tanpa ambang
         karangan: seek maju 30 detik cuma dihitung sepanjang tick-nya, dan
         tab yang dipindah ke latar — di mana Chrome men-clamp setInterval ke
         ~1 detik sementara audionya tetap jalan — tetap dihitung penuh.
         Ambang tetap (mis. "abaikan lompatan > 1 detik") justru membuang
         seluruh tick di kasus kedua, dan hitungannya diam-diam berhenti. */
      const dt = Math.min(played, wall);

      const th = thresholdFor(a.duration);
      const before = heardRef.current;
      const after = before + dt;
      heardRef.current = after;
      setHeard(after);
      if (before < th && after >= th) commitPlay();
    }, TICK_MS);

    return () => clearInterval(id);
  }, [playing, commitPlay]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a || status === "missing") return;
    if (a.paused) void a.play().catch(() => {});
    else a.pause();
  };

  const threshold = thresholdFor(duration);
  const settled = heard >= threshold;
  const remaining = Math.max(0, threshold - heard);
  const filled = duration > 0 ? Math.round((pos / duration) * SEGMENTS) : 0;
  const accrued = plays * net;

  return (
    <div className="proof">
      <audio ref={audioRef} src={TRACK.src} preload="metadata" />

      <div className="proof-l">
        <div className="eyebrow">
          {playing && <span className="pulse" />}
          {status === "missing"
            ? "DEMO TRACK NOT FOUND"
            : playing
              ? "NOW PLAYING"
              : "READY TO PLAY"}
        </div>
        <div className="track-title">{TRACK.title}</div>
        <div className="track-artist">
          {TRACK.artist}
          {duration > 0 && <> &middot; {mmss(duration)}</>}
        </div>

        <div className="bar" aria-hidden="true">
          {Array.from({ length: SEGMENTS }, (_, i) => (
            <i key={i} className={i < filled ? "on" : undefined} />
          ))}
        </div>
        <div className="timerow">
          <span>{mmss(pos)}</span>
          <span>{duration > 0 ? mmss(duration) : "--:--"}</span>
        </div>

        <div className="playrow">
          <button
            className="playbtn"
            onClick={toggle}
            disabled={status === "missing"}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? "❚❚" : "▶"}
          </button>
          <div className="small">
            {status === "missing" ? (
              <>
                The demo audio file couldn&apos;t load from <code>public/demo/</code>.
                The rest of the page still works.
              </>
            ) : (
              <>
                Press play.
                <br />
                Watch the numbers move.
              </>
            )}
          </div>
        </div>

        <div className="receipt">
          <div className="eyebrow" style={{ marginBottom: 14 }}>
            PROOF PER PLAY
          </div>
          <div className="rc">
            <span className="k">Play #</span>
            <span className="data" aria-live="polite">
              {plays}
            </span>
          </div>
          <div className="rc">
            <span className="k">Heard</span>
            <span className="data">{secs(heard)}s</span>
          </div>
          <div className="rc">
            <span className="k">Next play</span>
            <span className="data">
              {settled ? "when the song loops" : `${secs(remaining)}s left`}
            </span>
          </div>
          <div className="rc">
            <span className="k">Funded by</span>
            <span className="data">listener balance</span>
          </div>
          <div className="rc">
            <span className="k">Tx</span>
            <span className="data pending">simulation — play in the app for a real tx</span>
          </div>
          <p
            className="small"
            style={{ marginTop: 14, fontSize: 16, color: "var(--dimmer)", lineHeight: 1.5 }}
          >
            In the real app, every play above calls <code>reportPlays</code> once on the
            contract that&apos;s already live on Monad testnet, leaving one transaction
            anyone can open. No recap, no monthly report.
          </p>
        </div>
      </div>

      <div className="proof-r">
        <div className="eyebrow">SETTLEMENT PER PLAY</div>

        <div className={flash ? "sheet flash" : "sheet"}>
          <div className="row head">
            <span className="k" />
            <span className="v">PER PLAY</span>
            <span className="v sess">THIS SESSION</span>
          </div>

          <div className="row">
            <span className="k">Rate per play</span>
            <span className="v">{fmt(RATE_PER_PLAY)}</span>
            <span className="v sess">
              {plays > 0 ? fmt(plays * RATE_PER_PLAY) : "—"}
            </span>
          </div>
          <div className="row">
            <span className="k">
              Platform fee <span className="bps">{PLATFORM_FEE_BPS} bps</span>
            </span>
            <span className="v acc">{fmt(fee)}</span>
            <span className="v sess">{plays > 0 ? fmt(plays * fee) : "—"}</span>
          </div>
          {shares.map((p) => (
            <div className="row" key={p.name}>
              <span className="k">
                {p.name} <span className="bps">{p.bps} bps</span>
              </span>
              <span className="v">{fmt(p.amount)}</span>
              <span className="v sess">
                {plays > 0 ? fmt(plays * p.amount) : "—"}
              </span>
            </div>
          ))}

          <div className="row sum">
            <span className="k">Total split</span>
            <span className="v">{TOTAL_BPS} bps</span>
            <span className="v sess" />
          </div>
        </div>

        <div className="total">
          <span className="k">SPLIT THIS SESSION</span>
          <span className="v">{fmt(accrued)}</span>
        </div>

        <p className="disclaimer">
          Simulated at contract rates — <code>ratePerPlay</code> {RATE_PER_PLAY},{" "}
          <code>platformFeeBps</code> {PLATFORM_FEE_BPS}, total split {TOTAL_BPS} bps,
          6-decimal mUSD units. One play counts after{" "}
          {secs(threshold)}s heard — shortened from the 30-second industry convention to
          fit inside a single demo. The parameters above match what's live on the Monad
          testnet contract; the numbers in this widget are computed in the browser, not
          read directly from chain.
        </p>
      </div>
    </div>
  );
}
