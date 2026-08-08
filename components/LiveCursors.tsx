"use client";

/* Overlay cursor multiplayer — aktif di seluruh halaman, bukan dikurung di hero.

   Tiga keputusan yang menentukan apakah ini terasa mulus atau murahan:

   1. KOORDINAT FRAKSIONAL. Yang dikirim bukan `clientX/clientY`, tapi fraksi
      0..1 terhadap satu container referensi — di sini `.cursor-layer` sendiri,
      yang membentang persis seukuran dokumen. Penerima mengalikannya kembali
      dengan rect miliknya sendiri. Efek sampingnya: kebal scroll tanpa perlu
      mengirim `scrollY` sama sekali, dan kebal beda ukuran window.

   2. REACT TIDAK IKUT DI JALUR PANAS. State hanya berubah saat orang
      masuk/keluar. Koordinat ditulis langsung ke `style.transform` lewat ref
      di dalam satu rAF. 30 cursor × 10 pesan/detik = 300 re-render/detik
      kalau posisi disimpan di state — halaman akan tersendat justru saat
      ramai, tepat di momen fiturnya sedang dipamerkan.

   3. `translate3d` + `will-change`, tidak pernah `left`/`top`. Ditambah
      `transition: transform 120ms linear` di CSS — sedikit lebih panjang dari
      throttle 100ms, supaya satu animasi selalu tersambung ke animasi
      berikutnya dan gerakannya tidak pernah patah di antara dua pesan. */

import { useCallback, useEffect, useRef, useState } from "react";
import { clientId, identityFor } from "@/lib/cursor-identity";
import { openCursorTransport, type CursorTransport } from "@/lib/cursor-transport";

/* Batas sadar. Di bawah 1024px layout runtuh dari 3 kolom ke 1 kolom, dan
   koordinat fraksional jadi bohong — cursor menunjuk paragraf yang berbeda
   dari yang ditunjuk pengirimnya. Satu media query menghapus seluruh kelas
   bug itu; harganya cuma fitur yang memang tidak berarti tanpa mouse.
   Nilainya harus sama dengan `@media (max-width: 1023px)` di globals.css. */
const ACTIVE_QUERY = "(min-width: 1024px)";

/** Render maksimal 30. Lebih dari itu tidak menambah kesan ramai, cuma
 *  menambah node yang di-transform tiap frame. */
const MAX_CURSORS = 30;

/** Peer yang tidak mengirim apa pun selama ini dianggap pergi — jaring
 *  pengaman kalau event leave dari Presence tidak pernah datang. */
const IDLE_MS = 20_000;
const SWEEP_MS = 5_000;

type Peer = { x: number; y: number; seen: number };
type Box = { left: number; top: number; w: number; h: number };

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function LiveCursors() {
  const layerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef(new Map<string, HTMLDivElement | null>());
  const peersRef = useRef(new Map<string, Peer>());
  const boxRef = useRef<Box | null>(null);
  const frameRef = useRef(0);

  /* State hanya untuk keanggotaan (siapa yang digambar) dan jumlah roster —
     keduanya berubah pada skala detik, bukan pada skala frame. */
  const [ids, setIds] = useState<string[]>([]);
  const [others, setOthers] = useState(0);
  const [active, setActive] = useState(false);

  /* Rect diukur sekali lalu di-cache dalam koordinat halaman (bukan viewport),
     supaya `pointermove` tidak memicu layout tiap gerakan. Karena disimpan
     sebagai koordinat halaman, scroll tidak membuatnya basi — hanya resize
     dan perubahan tinggi dokumen yang membuatnya basi. */
  const measure = useCallback(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const r = layer.getBoundingClientRect();
    boxRef.current = {
      left: r.left + window.scrollX,
      top: r.top + window.scrollY,
      w: r.width,
      h: r.height,
    };
  }, []);

  const paint = useCallback(() => {
    if (frameRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      const box = boxRef.current;
      if (!box) return;
      nodesRef.current.forEach((node, id) => {
        const p = peersRef.current.get(id);
        if (!node || !p) return;
        node.style.transform = `translate3d(${(p.x * box.w).toFixed(1)}px, ${(
          p.y * box.h
        ).toFixed(1)}px, 0)`;
      });
    });
  }, []);

  /* Hidup-matikan seluruh fitur mengikuti lebar viewport. */
  useEffect(() => {
    const mq = window.matchMedia(ACTIVE_QUERY);
    const sync = () => setActive(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!active) {
      peersRef.current.clear();
      setIds([]);
      setOthers(0);
      return;
    }

    let transport: CursorTransport | null = null;
    let disposed = false;
    const self = clientId();

    measure();
    const onResize = () => {
      measure();
      paint();
    };
    window.addEventListener("resize", onResize);

    /* Tinggi dokumen berubah tanpa resize window (font selesai dimuat, marquee
       melipat, gambar masuk). ResizeObserver pada layer menangkap itu; tanpa
       ini semua cursor bergeser vertikal setelah font pixel selesai swap. */
    const ro = new ResizeObserver(onResize);
    if (layerRef.current) ro.observe(layerRef.current);

    const onPointerMove = (e: PointerEvent) => {
      const box = boxRef.current;
      if (!transport || !box || !box.w || !box.h) return;
      transport.sendCursor(
        clamp01((e.clientX + window.scrollX - box.left) / box.w),
        clamp01((e.clientY + window.scrollY - box.top) / box.h),
      );
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    const sweep = window.setInterval(() => {
      const cutoff = Date.now() - IDLE_MS;
      let dropped = false;
      peersRef.current.forEach((p, id) => {
        if (p.seen < cutoff) {
          peersRef.current.delete(id);
          dropped = true;
        }
      });
      if (dropped) setIds([...peersRef.current.keys()].slice(0, MAX_CURSORS));
    }, SWEEP_MS);

    /* Degradasi anggun: kalau transport tidak bisa dibuka (env var belum ada,
       realtime mati, kuota habis), `transport` tetap null dan halaman jalan
       normal — listener di atas cuma tidak punya tujuan kirim. */
    openCursorTransport(self)
      .then((t) => {
        if (!t) return;
        if (disposed) {
          t.close();
          return;
        }
        transport = t;

        t.onCursor((event) => {
          if (event.kind === "roster") {
            setOthers(event.ids.length);
            if (event.ids.length === 0 && peersRef.current.size) {
              peersRef.current.clear();
              setIds([]);
            }
            return;
          }

          if (event.kind === "gone") {
            if (peersRef.current.delete(event.id)) {
              setIds([...peersRef.current.keys()].slice(0, MAX_CURSORS));
            }
            return;
          }

          const known = peersRef.current.has(event.id);
          if (!known && peersRef.current.size >= MAX_CURSORS) return;
          peersRef.current.set(event.id, {
            x: event.x,
            y: event.y,
            seen: Date.now(),
          });
          if (!known) setIds([...peersRef.current.keys()].slice(0, MAX_CURSORS));
          paint();
        });
      })
      .catch(() => {
        /* sudah ditangani di dalam transport; ini jaring terakhir */
      });

    return () => {
      disposed = true;
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.clearInterval(sweep);
      ro.disconnect();
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
      transport?.close();
    };
  }, [active, measure, paint]);

  /* Node baru butuh transform pertamanya segera, kalau tidak ia berkedip
     sekali di pojok kiri atas sebelum pesan berikutnya datang. */
  useEffect(() => {
    paint();
  }, [ids, paint]);

  return (
    <>
      <div className="cursor-layer" ref={layerRef} aria-hidden="true">
        {ids.map((id) => {
          const { name, color } = identityFor(id);
          return (
            <div
              key={id}
              className="cursor"
              style={{ color }}
              ref={(node) => {
                if (node) nodesRef.current.set(id, node);
                else nodesRef.current.delete(id);
              }}
            >
              <svg
                width="12"
                height="18"
                viewBox="0 0 12 18"
                shapeRendering="crispEdges"
                aria-hidden="true"
              >
                <path
                  d="M0 0 L0 13 L3 10 L5 15 L8 14 L6 9 L10 9 Z"
                  fill="currentColor"
                  stroke="#000"
                  strokeWidth="2"
                  paintOrder="stroke"
                />
              </svg>
              <b style={{ background: color }}>{name}</b>
            </div>
          );
        })}
      </div>

      {active && others > 0 && (
        <p className="presence-note">
          <i style={{ color: "var(--purple)" }}>{others}</i> orang lain sedang
          membuka halaman ini.
        </p>
      )}
    </>
  );
}
