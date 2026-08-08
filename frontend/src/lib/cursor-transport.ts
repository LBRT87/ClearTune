/* ══════════════════════════════════════════════════════════════════════════
   Transport cursor — SATU-SATUNYA file di repo ini yang boleh mengimpor
   `@supabase/supabase-js`.

   Aturannya keras dan disengaja (tiket 01 §6): dunia luar hanya melihat
   `sendCursor(x, y)` dan `onCursor(cb)`. Selama itu benar, menukar Supabase
   dengan Ably kalau kuota jebol di panggung adalah pekerjaan ~30 menit di
   dalam file ini saja — tidak ada komponen yang perlu disentuh.

   Bukti seam-nya nyata, bukan klaim: ada DUA implementasi di balik antarmuka
   yang sama di file ini — Supabase dan loopback BroadcastChannel (khusus
   development, lihat paling bawah).

   Hybrid Presence + Broadcast (tiket 01 §4):
   - Presence  → roster join/leave. Limit 20 pesan/detik.
   - Broadcast → koordinat. Limit 100 pesan/detik.
   Koordinat TIDAK PERNAH lewat Presence; itu jalan tercepat menabrak limit.

   Ekonominya O(N²) — Supabase menagih fan-out (1 broadcast ke N = 1+N pesan).
   Mitigasi kuota di bawah ini bukan optimasi opsional, itu yang menentukan
   demo 30 menit muat di kuota 2 juta/bulan atau tidak.
   ══════════════════════════════════════════════════════════════════════════ */

import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

const ROOM = "cleartune:landing";
const EVENT = "c";

/** Throttle, bukan debounce. Debounce = cursor membeku selama orang bergerak
 *  terus dan baru melompat saat berhenti — persis kebalikan dari yang perlu. */
const THROTTLE_MS = 100;

/** 4 desimal ≈ 0,15px di layar 1440. Presisi di atas itu hanya menambah byte. */
const PRECISION = 1e4;

export type CursorEvent =
  /** Peer bergerak. x/y fraksi 0..1 terhadap container referensi pengirim. */
  | { kind: "move"; id: string; x: number; y: number }
  /** Peer keluar (tab ditutup, tab disembunyikan, koneksi putus). */
  | { kind: "gone"; id: string }
  /** Daftar lengkap peer yang sedang hadir — sumber kebenaran untuk jumlah. */
  | { kind: "roster"; ids: string[] };

export type CursorTransport = {
  sendCursor(x: number, y: number): void;
  onCursor(cb: (event: CursorEvent) => void): () => void;
  close(): void;
};

/* ── bagian yang dipakai bersama kedua implementasi ─────────────────────── */

function createEmitter() {
  const listeners = new Set<(event: CursorEvent) => void>();
  return {
    onCursor(cb: (event: CursorEvent) => void) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    emit(event: CursorEvent) {
      listeners.forEach((cb) => {
        try {
          cb(event);
        } catch {
          /* satu listener rusak tidak boleh menjatuhkan transport */
        }
      });
    },
  };
}

/** Throttle leading+trailing dengan penyaring "posisi benar-benar berubah".
 *  Leading supaya gerakan pertama terasa instan; trailing supaya posisi
 *  terakhir sebelum berhenti tidak tertinggal di tengah layar. */
function createThrottledSender(deliver: (x: number, y: number) => void) {
  let pending: [number, number] | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastX = NaN;
  let lastY = NaN;

  function fire() {
    const next = pending;
    pending = null;
    if (next && (next[0] !== lastX || next[1] !== lastY)) {
      lastX = next[0];
      lastY = next[1];
      deliver(lastX, lastY);
    }
    timer = setTimeout(() => {
      timer = null;
      if (pending) fire();
    }, THROTTLE_MS);
  }

  return {
    push(x: number, y: number) {
      const rx = Math.round(x * PRECISION) / PRECISION;
      const ry = Math.round(y * PRECISION) / PRECISION;
      if (rx === lastX && ry === lastY) return; // diam = nol pesan
      pending = [rx, ry];
      if (!timer) fire();
    },
    /** Setelah reconnect, peer lain kehilangan posisi kita — paksa kirim
     *  ulang walau koordinatnya sama dengan sebelum tab disembunyikan. */
    reset() {
      pending = null;
      lastX = NaN;
      lastY = NaN;
      if (timer) clearTimeout(timer);
      timer = null;
    },
    dispose() {
      if (timer) clearTimeout(timer);
      timer = null;
      pending = null;
    },
  };
}

/* ── implementasi 1: Supabase Realtime ──────────────────────────────────── */

export async function openCursorTransport(
  selfId: string,
): Promise<CursorTransport | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return openLoopbackTransport(selfId);

  /* Degradasi anggun: apa pun yang gagal di bawah ini — import, createClient,
     subscribe — mengembalikan null, dan halaman tetap halaman normal. Tidak
     boleh ada layar rusak di panggung. */
  try {
    /* Dynamic import supaya ~35 kB supabase-js tidak ikut di bundle awal.
       Kalau env var tidak dipasang, kodenya tidak pernah diunduh sama sekali. */
    const { createClient } = await import("@supabase/supabase-js");

    const supabase: SupabaseClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      /* Rate limit sisi klien. Throttle kita 10 pesan/detik; 20 memberi
         ruang untuk trailing edge tanpa mendekati limit broadcast 100. */
      realtime: { params: { eventsPerSecond: 20 } },
    });

    const { onCursor, emit } = createEmitter();
    let channel: RealtimeChannel | null = null;
    /* Terpisah dari `channel` karena keduanya menjawab pertanyaan berbeda:
       `channel` = ada yang perlu dibersihkan, `joined` = boleh kirim.
       supabase-js diam-diam mengubah `send()` sebelum SUBSCRIBED jadi satu
       HTTP POST per pesan — jalur yang jauh lebih mahal dan tidak kita
       inginkan hanya karena orang menggerakkan mouse selama handshake. */
    let joined = false;
    let closed = false;

    const sender = createThrottledSender((x, y) => {
      if (!channel || !joined) return;
      try {
        channel.send({ type: "broadcast", event: EVENT, payload: { i: selfId, x, y } });
      } catch {
        /* pesan hilang bukan alasan menjatuhkan sesi */
      }
    });

    function roster(ch: RealtimeChannel) {
      try {
        const ids = Object.keys(ch.presenceState()).filter((id) => id !== selfId);
        emit({ kind: "roster", ids });
      } catch {
        /* abaikan */
      }
    }

    function connect() {
      if (closed || channel) return;
      try {
        const ch = supabase.channel(ROOM, {
          config: {
            /* self:false — echo pesan sendiri hanya menggandakan kuota;
               browser sudah menggambar cursor kita sendiri. */
            broadcast: { self: false },
            presence: { key: selfId, enabled: true },
            private: false,
          },
        });

        ch.on("broadcast", { event: EVENT }, ({ payload }) => {
          const p = payload as { i?: unknown; x?: unknown; y?: unknown };
          if (typeof p?.i !== "string" || p.i === selfId) return;
          if (typeof p.x !== "number" || typeof p.y !== "number") return;
          emit({ kind: "move", id: p.i, x: p.x, y: p.y });
        });

        ch.on("presence", { event: "sync" }, () => roster(ch));
        ch.on("presence", { event: "join" }, () => roster(ch));
        ch.on("presence", { event: "leave" }, ({ leftPresences }) => {
          /* key presence = client id, tapi leftPresences membawa payload
             yang kita track — makanya id ikut ditulis di dalamnya. */
          (leftPresences as Array<{ id?: string }>).forEach((p) => {
            if (p?.id && p.id !== selfId) emit({ kind: "gone", id: p.id });
          });
          roster(ch);
        });

        ch.subscribe((status) => {
          joined = status === "SUBSCRIBED";
          if (joined) {
            /* Reconnect: peer lain sudah kehilangan posisi kita, jadi gerakan
               berikutnya harus lolos walau koordinatnya identik. */
            sender.reset();
            ch.track({ id: selfId }).catch(() => {});
          }
        });

        channel = ch;
      } catch {
        channel = null;
      }
    }

    function disconnect() {
      const ch = channel;
      channel = null;
      joined = false;
      sender.reset();
      /* Peer lain akan menerima leave dari server, tapi kita juga bersihkan
         layar sendiri: setelah tab hidden kita tidak menerima apa pun lagi,
         jadi posisi yang tersisa di layar akan basi. */
      emit({ kind: "roster", ids: [] });
      if (!ch) return;
      try {
        ch.untrack().catch(() => {});
        supabase.removeChannel(ch);
      } catch {
        /* abaikan */
      }
    }

    /* Pemangkas kuota terbesar dan gratis: tab yang tidak terlihat tidak
       memberi nilai apa pun tapi tetap menagih fan-out penuh. */
    const onVisibility = () => {
      if (document.visibilityState === "hidden") disconnect();
      else connect();
    };
    const onPageHide = () => disconnect();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);

    if (document.visibilityState === "visible") connect();

    return {
      sendCursor: (x, y) => sender.push(x, y),
      onCursor,
      close() {
        closed = true;
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("pagehide", onPageHide);
        sender.dispose();
        disconnect();
      },
    };
  } catch {
    return null;
  }
}

/* ── implementasi 2: loopback BroadcastChannel (development saja) ────────
   Bukan fallback produksi. Tanpa env var di production build, cursor
   sekadar tidak muncul — halaman bohong yang memperlihatkan "multiplayer"
   yang sebenarnya cuma antar-tab di satu browser jauh lebih berbahaya di
   depan juri daripada halaman yang jujur tidak punya cursor.

   Gunanya: memverifikasi normalisasi koordinat, throttle, roster, dan
   overlay tanpa menunggu project Supabase ada. Sekaligus bukti bahwa
   seam `sendCursor`/`onCursor` benar-benar bisa ditukar. */

function openLoopbackTransport(selfId: string): CursorTransport | null {
  if (process.env.NODE_ENV !== "development") return null;
  if (typeof BroadcastChannel === "undefined") return null;

  try {
    const bus = new BroadcastChannel(ROOM);
    const { onCursor, emit } = createEmitter();
    const present = new Set<string>();

    // eslint-disable-next-line no-console
    console.warn(
      "[cursor] LOOPBACK — NEXT_PUBLIC_SUPABASE_URL belum dipasang. " +
        "Cursor hanya terlihat antar-tab di browser ini, tidak lintas device.",
    );

    const announceRoster = () => emit({ kind: "roster", ids: [...present] });

    const sender = createThrottledSender((x, y) => {
      bus.postMessage({ t: "c", i: selfId, x, y });
    });

    bus.onmessage = (e) => {
      const m = e.data as { t?: string; i?: string; x?: number; y?: number };
      if (!m?.i || m.i === selfId) return;
      if (m.t === "hi") {
        bus.postMessage({ t: "yo", i: selfId });
      }
      if (m.t === "bye") {
        present.delete(m.i);
        emit({ kind: "gone", id: m.i });
        announceRoster();
        return;
      }
      if (!present.has(m.i)) {
        present.add(m.i);
        announceRoster();
      }
      if (m.t === "c" && typeof m.x === "number" && typeof m.y === "number") {
        emit({ kind: "move", id: m.i, x: m.x, y: m.y });
      }
    };

    bus.postMessage({ t: "hi", i: selfId });
    const onPageHide = () => bus.postMessage({ t: "bye", i: selfId });
    window.addEventListener("pagehide", onPageHide);

    return {
      sendCursor: (x, y) => sender.push(x, y),
      onCursor,
      close() {
        window.removeEventListener("pagehide", onPageHide);
        sender.dispose();
        try {
          bus.postMessage({ t: "bye", i: selfId });
          bus.close();
        } catch {
          /* abaikan */
        }
      },
    };
  } catch {
    return null;
  }
}
