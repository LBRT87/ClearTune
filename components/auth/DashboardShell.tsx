"use client";

/* Shell dashboard `/app` dan `/studio` (tiket auth/05).

   Identitas + PLACEHOLDER JUJUR. Tidak ada player, tidak ada grafik
   pendapatan, tidak ada angka karangan: spec §7 menaruh keduanya di
   langkah 3 & 5, dan shell yang berbohong akan menipu tim sendiri besok
   pagi. Kalau sesuatu belum ada, yang ditulis adalah "belum ada" beserta
   alasannya — bukan nol yang menyesatkan.

   Anggaran border 3px (aturan restraint 04): topbar (1) + kartu dompet
   (2). Semua placeholder 1px dashed. */

import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth";
import Link from "next/link";
import type { Profile } from "@/lib/profile-types";

function truncate(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

const BLOCKS: Record<"artist" | "listener", [string, string][]> = {
  artist: [
    [
      "PENDAPATAN",
      "Belum ada lagu terdaftar, jadi belum ada yang bisa dihitung. Bukan nol — belum ada. Spec §7 langkah 5.",
    ],
    [
      "DAFTARKAN LAGU",
      "Butuh alamat kontrak. NEXT_PUBLIC_CONTRACT_ADDRESS masih kosong, jadi tombolnya sengaja tidak digambar. Spec §7 langkah 2.",
    ],
    [
      "SPLIT SHEET",
      "Pembagian per lagu dibuat saat lagu didaftarkan. Belum ada lagu.",
    ],
  ],
  listener: [
    ["PUTAR LAGU", "Player dan katalog belum dibangun. Spec §7 langkah 3."],
    [
      "RIWAYAT PUTAR",
      "Belum ada satu pun putaran tercatat — tabel plays masih kosong.",
    ],
    ["CHART", "Butuh data putar dari orang lain juga. Spec §7 langkah 4."],
  ],
};

export function DashboardShell({
  profile,
  email,
  backend,
}: {
  profile: Profile;
  email: string | null;
  backend: "supabase" | "memory" | null;
}) {
  const { logout } = usePrivy();
  const { wallets } = useWallets();

  /* Khusus embedded, bukan `wallets[0]` — urutan array tidak dijamin, dan
     alamat yang ditampilkan harus alamat yang sama dengan yang tercatat. */
  const embedded = wallets.find((w) => w.walletClientType === "privy");
  const address = profile.wallet ?? embedded?.address ?? null;
  const isArtist = profile.role === "artist";
  const hasContract = Boolean(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS);

  return (
    <div style={{ minHeight: "100dvh", display: "grid", gridTemplateRows: "auto 1fr" }}>
      <header className="topbar">
        <Link href="/" className="brand" style={{ textDecoration: "none" }}>
          CLEARTUNE<i>.</i>
        </Link>
        <div className="ident">
          <div className="small" style={{ textAlign: "right", lineHeight: 1.25 }}>
            <div style={{ color: "var(--ink)" }}>{profile.display_name}</div>
            <div className="data" style={{ fontSize: 16, color: "var(--dimmer)" }}>
              {email ?? "—"}
              {address ? ` · ${truncate(address)}` : " · dompet belum siap"}
            </div>
          </div>
          <span className="chip">{isArtist ? "MUSISI" : "PENDENGAR"}</span>
          <button className="tlink" onClick={() => logout()}>
            keluar
          </button>
        </div>
      </header>

      <main className="dash">
        <div className="dash-stack">
          {/* Profil belum permanen — dikatakan, bukan disembunyikan.
              Hilang sendiri begitu tiket 08 selesai. */}
          {backend === "memory" && (
            <div className="ph" style={{ borderColor: "var(--yellow)", textAlign: "left" }}>
              <div className="tag" style={{ color: "var(--yellow)" }}>
                PROFIL BELUM TERSIMPAN PERMANEN
              </div>
              <p className="say" style={{ margin: 0, maxWidth: "60ch" }}>
                Project Supabase belum dibuat (tiket 08), jadi peran dan nama ini
                hidup di memori server dan hilang saat server restart. Alurnya
                nyata; penyimpanannya belum.
              </p>
            </div>
          )}

          <section className="wallet-card">
            <div className="wrow">
              <div>
                <div className="eyebrow" style={{ marginBottom: "var(--a1)" }}>
                  DOMPETMU
                </div>
                <div className="data" style={{ fontSize: 26 }}>
                  {address ? truncate(address) : "belum siap"}
                </div>
              </div>
              <p className="small" style={{ maxWidth: "34ch", textAlign: "right" }}>
                {address
                  ? "Dibuatkan otomatis saat akunmu dibuat. Kuncinya milikmu, bukan milik ClearTune."
                  : "Privy masih membuat dompetmu. Muat ulang sebentar lagi."}
              </p>
            </div>

            <div className="wrow">
              <div>
                <div className="eyebrow" style={{ marginBottom: "var(--a1)" }}>
                  SALDO mUSD
                </div>
                <div
                  className="data"
                  style={{ fontSize: 26, color: hasContract ? "var(--ink)" : "var(--dimmer)" }}
                >
                  —
                </div>
              </div>
              <p className="small" style={{ maxWidth: "34ch", textAlign: "right" }}>
                {hasContract
                  ? "Menunggu pembacaan kontrak."
                  : "Kontrak belum ter-deploy. Kosong karena memang belum ada, bukan karena nol."}
              </p>
            </div>

            <div className="wrow">
              <div>
                <div className="eyebrow" style={{ marginBottom: "var(--a1)" }}>
                  GAS (MON)
                </div>
                <div className="data" style={{ fontSize: 26, color: "var(--dimmer)" }}>
                  {profile.funded_at ? "terkirim" : "—"}
                </div>
              </div>
              <p className="small" style={{ maxWidth: "34ch", textAlign: "right" }}>
                {profile.funded_at
                  ? "MON untuk biaya transaksi sudah dikirim ke dompetmu."
                  : "Drip MON belum dijalankan — itu tiket 06, dan butuh DEPLOYER_PRIVATE_KEY."}
              </p>
            </div>
          </section>

          {BLOCKS[profile.role].map(([tag, say]) => (
            <div className="ph" key={tag}>
              <div className="tag">{tag} · BELUM ADA</div>
              <p className="say">{say}</p>
            </div>
          ))}

          {/* Musisi jelas juga mendengarkan — peran menentukan mendarat di
              mana, bukan apa yang boleh dilakukan. */}
          {isArtist && (
            <Link className="tlink" href="/app">
              buka beranda dengar →
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
