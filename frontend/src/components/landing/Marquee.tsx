"use client";

import { useEffect, useRef, useState } from "react";

const ITEMS = [
  "MONAD TESTNET",
  "SETTLE PER PLAY",
  "92% TO ARTISTS",
  "TRUST LAYER ACTIVE",
  "WITHDRAW ANYTIME",
];

const MAX_REPS = 24;

/**
 * Pita berjalan.
 *
 * Jebakannya: animasi loop pakai translateX(-50%), jadi setengah dari isi harus
 * minimal selebar viewport. Kalau satu set konten lebih sempit dari layar,
 * -50% menggeser kurang dari satu layar penuh dan muncul celah hitam di ujung.
 * Karena itu set-nya diulang (`reps`) sampai separuh isi >= lebar viewport.
 */
export function Marquee() {
  const ref = useRef<HTMLDivElement>(null);
  const [reps, setReps] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reps < MAX_REPS && el.scrollWidth / 2 < window.innerWidth) {
      setReps((r) => r + 1);
    }
  }, [reps]);

  // digandakan dua kali: separuh pertama yang tergeser keluar layar oleh -50%
  return (
    <div className="marquee">
      <div className="marquee-inner" ref={ref}>
        {Array.from({ length: reps * 2 }, (_, r) =>
          ITEMS.map((t) => (
            <span key={`${r}-${t}`}>
              {t}
              <b style={{ paddingInline: "var(--s3)" }}>&#9679;</b>
            </span>
          ))
        )}
      </div>
    </div>
  );
}
