"use client";

/* `/daftar` dan `/masuk` (tiket auth/05, bentuk dari prototipe 03).

   Dua route terpisah walau mesinnya identik — Privy tidak mengenal beda
   daftar vs masuk. Yang membedakan keduanya BUKAN judulnya:

   - `/daftar` menjanjikan (apa yang akan kamu dapat), dan copy-nya tahu
     asal kliknya: yang datang dari `?role=musisi` tidak disambut kalimat
     yang sama dengan yang datang dari `?role=pendengar`.
   - `/masuk` melaporkan (apa yang sudah menunggu), tidak menyebut peran
     sama sekali, dan punya satu kalimat yang cuma masuk akal di layar
     masuk: peringatan bahwa akun Google berbeda = dompet berbeda. */

import { useLogin } from "@privy-io/react-auth";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Kind = "daftar" | "masuk";

const COPY = {
  daftar: {
    musisi: {
      eyebrow: "DAFTAR · MUSISI",
      h1: (
        <>
          MULAI <em>DIBAYAR</em> PER PUTARAN.
        </>
      ),
      lede: "Satu akun, dompetnya langsung jadi. Tiap kali lagumu diputar, bagianmu masuk ke sana — bukan 90 hari lagi.",
    },
    pendengar: {
      eyebrow: "DAFTAR · PENDENGAR",
      h1: (
        <>
          DENGAR. <em>LANGSUNG</em> SAMPAI.
        </>
      ),
      lede: "Buat akun, dapat dompet, dan tiap lagu yang kamu putar mengirim uang ke orang yang membuatnya. Angkanya bisa kamu lihat.",
    },
  },
  masuk: {
    eyebrow: "MASUK",
    h1: <>DOMPETMU MASIH DI SINI.</>,
    lede: "Tidak ada yang perlu dibuat ulang. Masuk dengan cara yang sama seperti waktu itu.",
    note: "Pakai akun Google yang sama seperti waktu daftar. Akun berbeda = dompet berbeda.",
  },
};

/* Ikon Google inline: satu <svg>, bukan request ke CDN. */
function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M21.35 11.1h-9.17v2.98h5.27c-.23 1.37-1.63 4.02-5.27 4.02-3.17 0-5.76-2.63-5.76-5.87s2.59-5.87 5.76-5.87c1.8 0 3.01.77 3.7 1.43l2.52-2.43C16.78 3.9 14.7 3 12.18 3 6.99 3 2.8 7.19 2.8 12.38s4.19 9.38 9.38 9.38c5.42 0 9-3.81 9-9.17 0-.62-.07-1.09-.16-1.49z"
      />
    </svg>
  );
}

export function GateScreen({ kind, role }: { kind: Kind; role: "musisi" | "pendengar" }) {
  const [waiting, setWaiting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Keadaan menunggu berhenti begitu Privy menjawab — berhasil maupun
     gagal. Tanpa `onError`, orang yang menutup modal akan melihat tombol
     tertahan selamanya dan mengira halamannya menggantung. */
  const { login } = useLogin({
    onComplete: () => setWaiting(false),
    onError: () => setWaiting(false),
  });

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function start() {
    setWaiting(true);
    /* Jaring pengaman: kalau modal gagal muncul tanpa memicu callback apa
       pun, tombol tidak boleh terkunci permanen. */
    timer.current = setTimeout(() => setWaiting(false), 12000);
    login();
  }

  const c = kind === "daftar" ? COPY.daftar[role] : COPY.masuk;

  return (
    <div className="auth-screen">
      <div className="auth-col auth-col-wide">
        <div className="eyebrow" style={{ marginBottom: "var(--a3)" }}>
          {c.eyebrow}
        </div>
        <h1 style={{ marginBottom: "var(--a3)" }}>{c.h1}</h1>
        {/* satu-satunya 64 di layar ini */}
        <p className="lede" style={{ marginBottom: "var(--a5)" }}>
          {c.lede}
        </p>

        <div style={{ width: "100%", display: "grid", gap: "var(--a2)", justifyItems: "center" }}>
          {/* Bayangan runtuh = "sedang dikerjakan". Bahasa yang sama dengan
              tombol ditekan, jadi tidak ada benda baru yang harus dipelajari. */}
          <button
            className={`btn btn-purple${waiting ? " waiting" : ""}`}
            onClick={start}
            disabled={waiting}
          >
            {waiting ? (
              <>
                MEMBUKA GOOGLE<span className="dots" />
              </>
            ) : (
              <>
                <GoogleMark /> LANJUT DENGAN GOOGLE
              </>
            )}
          </button>

          <div style={{ minHeight: 26 }}>
            {waiting && (
              <p className="small" style={{ color: "var(--dimmer)" }}>
                Jendela Google sedang dibuka. Jangan tutup halaman ini.
              </p>
            )}
          </div>

          {/* Email OTP ada di modal yang sama — jaring pengaman untuk
              in-app browser, tempat Google OAuth bisa mati total. */}
          <button className="tlink" onClick={start} disabled={waiting}>
            atau pakai kode yang dikirim ke email
          </button>
        </div>

        {kind === "masuk" && (
          <p
            className="small"
            style={{ maxWidth: "38ch", marginTop: "var(--a3)", color: "var(--dimmer)" }}
          >
            {COPY.masuk.note}
          </p>
        )}

        <div style={{ marginTop: "var(--a4)" }}>
          {kind === "daftar" ? (
            <Link className="tlink" href="/masuk">
              Sudah punya akun? <b>MASUK</b>
            </Link>
          ) : (
            <Link className="tlink" href="/daftar">
              Belum punya akun? <b>DAFTAR</b>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
