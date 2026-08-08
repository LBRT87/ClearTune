"use client";

/* Layar pilih peran — VARIAN C dari prototipe 03: satu kolom, dua langkah.

   Langkah 1 = dua kartu. Langkah 2 = nama panggung (musisi) atau
   konfirmasi nama acak (pendengar).

   Kenapa dua langkah: field nama tidak pernah berbagi layar dengan
   kartunya, jadi masalah "layar berubah tinggi saat kartu diklik" hilang
   dari akarnya alih-alih diakali. Ongkosnya satu layar tambahan.

   Aturan yang mengikat di sini (semua diturunkan di tiket 03):
   - Tidak ada satu pun elemen Press Start 2P di atas 24px. Judul layar
     turun jadi eyebrow + satu kalimat VT323; judul kartu h3 (15px).
     Display type milik naratif, dan layar keputusan tidak punya narasi.
   - Ungu-vs-abu adalah keseluruhan bahasanya. Kartu kedua tidak punya
     aksen sendiri — hijau sudah berarti "uang bertambah" di seluruh
     produk.
   - Urutan kartu TIDAK PERNAH diubah oleh `?role=`. MUSISI selalu di
     atas; yang kedua akan terbaca sebagai cadangan kalau ditukar. */

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { homeFor, type Role } from "@/lib/profile-types";
import { randomListenerName } from "@/lib/display-name";

const ROLES: { key: Role; title: string; why: string; dest: string }[] = [
  {
    key: "artist",
    title: "MUSISI",
    why: "Kamu unggah lagu, tentukan siapa dapat berapa, dan uangnya masuk ke dompetmu tiap kali diputar.",
    dest: "→ /studio",
  },
  {
    key: "listener",
    title: "PENDENGAR",
    why: "Kamu dengar, dan tiap putaran mengalir ke orang yang membuat lagunya. Tidak ada yang perlu kamu atur.",
    dest: "→ /app",
  },
];

export function RolePicker({
  preselected,
  onDone,
}: {
  /** Dari `?role=` milik CTA landing. MEMILIHKAN, tidak mengunci. */
  preselected: Role | null;
  onDone: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [picked, setPicked] = useState<Role | null>(preselected);
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Diacak SEKALI di klien lalu dibawa ke API. Orang melihat nama ini di
     langkah 2 sebelum masuk — kalau server mengacak sendiri, yang tampil
     bukan yang tersimpan. */
  const [listenerName] = useState(randomListenerName);

  useEffect(() => {
    if (step === 2 && picked === "artist") inputRef.current?.focus();
  }, [step, picked]);

  function choose(role: Role) {
    setPicked(role);
    setErr("");
    setStep(2);
  }

  async function submit() {
    if (!picked) return;
    const displayName = picked === "artist" ? name.trim() : listenerName;

    if (picked === "artist" && !displayName) {
      setErr("Isi dulu nama panggungmu.");
      return;
    }

    setSaving(true);
    setErr("");
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: picked, display_name: displayName }),
      });

      if (res.status === 409) {
        /* Satu-satunya cara pendaftaran bisa gagal, dan letaknya di langkah
           terakhir. Galatnya mendarat DI DALAM field: orang tetap di
           langkah 2, peran yang sudah dipilih tidak hilang, dan dia tidak
           dilempar keluar setelah repot login. */
        setErr(`“${displayName}” sudah dipakai. Coba nama lain.`);
        setSaving(false);
        inputRef.current?.focus();
        return;
      }

      if (!res.ok) {
        setErr("Gagal menyimpan. Coba lagi sebentar.");
        setSaving(false);
        return;
      }

      onDone();
      router.replace(homeFor(picked));
    } catch {
      setErr("Gagal menyimpan. Coba lagi sebentar.");
      setSaving(false);
    }
  }

  /* ── LANGKAH 1 ── */
  if (step === 1) {
    return (
      <div className="auth-screen">
        <div className="auth-col">
          <div className="auth-steps" style={{ marginBottom: "var(--a3)" }}>
            <b>1</b>—<span>2</span>
            <span style={{ marginLeft: 10 }}>LANGKAH TERAKHIR</span>
          </div>
          <p className="lede" style={{ marginBottom: "var(--a4)", color: "var(--ink)" }}>
            Kamu di sini sebagai siapa?
          </p>

          <div style={{ width: "100%", display: "grid", gap: "var(--a2)" }}>
            {ROLES.map((r) => (
              <button
                key={r.key}
                className={`role-row${picked === r.key ? " on" : ""}`}
                onClick={() => choose(r.key)}
              >
                <span style={{ display: "grid", gap: "var(--a1)" }}>
                  <h3>{r.title}</h3>
                  <span className="why">{r.why}</span>
                  <span className="dest">{r.dest}</span>
                </span>
                <span className="go">▸</span>
              </button>
            ))}
          </div>

          <p className="small" style={{ marginTop: "var(--a4)", color: "var(--dimmer)" }}>
            Peran menentukan kamu mendarat di mana, bukan apa yang boleh kamu lakukan.
          </p>
        </div>
      </div>
    );
  }

  /* ── LANGKAH 2 ── */
  const isArtist = picked === "artist";
  return (
    <div className="auth-screen">
      <div className="auth-col">
        <div className="auth-steps" style={{ marginBottom: "var(--a3)" }}>
          <span>1</span>—<b>2</b>
          <span style={{ marginLeft: 10 }}>{isArtist ? "MUSISI" : "PENDENGAR"}</span>
        </div>
        <p className="lede" style={{ marginBottom: "var(--a4)", color: "var(--ink)" }}>
          {isArtist ? "Dengan nama siapa lagumu terbit?" : "Tinggal satu ketukan."}
        </p>

        <div style={{ width: "100%", display: "grid", gap: "var(--a4)" }}>
          {isArtist ? (
            <div className={`field${err ? " bad" : ""}`}>
              <label htmlFor="stage-name">NAMA PANGGUNG</label>
              <input
                id="stage-name"
                ref={inputRef}
                value={name}
                maxLength={24}
                autoComplete="off"
                placeholder="mis. hindia"
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
              {err ? (
                <div className="err">
                  <b>!</b>
                  <span>{err}</span>
                </div>
              ) : (
                <div className="hint">
                  Nama ini ikut membeku di kredit tiap lagu yang kamu terbitkan.
                </div>
              )}
            </div>
          ) : (
            <div className="ph" style={{ textAlign: "left", borderColor: "#3a3a3a" }}>
              <div className="tag">NAMA TAMPILANMU</div>
              <div className="data" style={{ color: "var(--ink)", fontSize: 26 }}>
                {listenerName}
              </div>
              <div className="say" style={{ margin: 0 }}>
                Dibuatkan otomatis. Tidak ada yang perlu kamu isi.
              </div>
              {err && (
                <div className="err" style={{ marginTop: "var(--a1)" }}>
                  <b>!</b>
                  <span>{err}</span>
                </div>
              )}
            </div>
          )}

          <button
            className={`btn btn-purple${saving ? " waiting" : ""}`}
            onClick={submit}
            disabled={saving}
          >
            {saving ? (
              <>
                MENYIMPAN<span className="dots" />
              </>
            ) : isArtist ? (
              "MASUK KE STUDIO"
            ) : (
              "MASUK KE BERANDA"
            )}
          </button>
        </div>

        {/* Kembali TANPA kehilangan peran yang sudah dipilih. */}
        <button
          className="tlink"
          style={{ marginTop: "var(--a3)" }}
          onClick={() => {
            setErr("");
            setStep(1);
          }}
          disabled={saving}
        >
          ← ganti peran
        </button>
      </div>
    </div>
  );
}
