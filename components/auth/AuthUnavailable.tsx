"use client";

/* Tanpa NEXT_PUBLIC_PRIVY_APP_ID, halaman auth tetap terbuka dan
   MENGATAKAN apa yang kurang — tidak putih, tidak crash, tidak pura-pura
   punya tombol login yang tidak akan pernah jalan.

   Pola yang sama dengan cara `.env.example` memperlakukan Supabase:
   variabel kosong berarti fitur padam, bukan halaman rusak.

   `isAuthUsable` dievaluasi dari `process.env` yang di-inline saat build,
   jadi nilainya konstan sepanjang hidup halaman — memakainya untuk
   bercabang sebelum hook apa pun tidak melanggar aturan hook. */

import Link from "next/link";
import { isPrivyConfigured } from "@/components/providers";

export const isAuthUsable = isPrivyConfigured;

export function AuthUnavailable() {
  return (
    <div className="auth-screen">
      <div className="auth-col">
        <div className="eyebrow" style={{ marginBottom: "var(--a3)" }}>
          AUTH BELUM DIKONFIGURASI
        </div>
        <p className="lede" style={{ marginBottom: "var(--a4)", color: "var(--ink)" }}>
          `NEXT_PUBLIC_PRIVY_APP_ID` masih kosong.
        </p>
        <p className="small" style={{ marginBottom: "var(--a4)" }}>
          Isi di `.env.local` (tiket auth/01), lalu jalankan ulang dev server.
          Landing page tetap jalan normal tanpa ini.
        </p>
        <Link className="tlink" href="/">
          ← kembali ke beranda
        </Link>
      </div>
    </div>
  );
}
