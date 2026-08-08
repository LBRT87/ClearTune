/* Penyimpanan profil — SERVER SAJA (tiket auth/04, 05, 08).

   Klien tidak pernah menyentuh tabel ini. Akses lewat `service_role` yang
   melewati RLS, jadi kunci ini tidak boleh pernah punya prefix
   NEXT_PUBLIC_ dan file ini tidak boleh pernah diimpor dari komponen
   klien. Semua akses lewat `app/api/profile/route.ts`.

   DUA BACKEND, dan itu disengaja:

   - `supabase` — begitu tiket 08 selesai (project dibuat, DDL dijalankan,
     env terisi). Ini yang sebenarnya.
   - `memory`  — selama tiket 08 belum selesai. Bukan supaya demo bisa
     berbohong, tapi supaya alur pilih-peran bisa dibangun dan dites hari
     ini. Backend-nya ikut dikirim ke klien dan shell dashboard
     MENGATAKANNYA secara terbuka: profil belum tersimpan permanen.
     Pola yang sama dengan cara `.env.example` memperlakukan Supabase —
     variabel kosong berarti fitur padam, bukan halaman rusak. */

import { createClient } from "@supabase/supabase-js";
import type { Profile, Role } from "./profile-types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export type ProfileBackend = "supabase" | "memory";
export const profileBackend: ProfileBackend =
  url && serviceKey ? "supabase" : "memory";

const supabase =
  url && serviceKey
    ? createClient(url, serviceKey, { auth: { persistSession: false } })
    : null;

/* Hidup selama proses server hidup. Hot reload dev menghapusnya — itu
   benar, karena ini memang bukan penyimpanan. */
const memory = new Map<string, Profile>();

export type CreateInput = {
  privy_did: string;
  wallet: string | null;
  role: Role;
  display_name: string;
};

export type CreateResult =
  | { ok: true; profile: Profile }
  | { ok: false; reason: "name-taken" };

export async function getProfile(did: string): Promise<Profile | null> {
  if (!supabase) return memory.get(did) ?? null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("privy_did", did)
    .maybeSingle();

  if (error) throw new Error(`gagal membaca profiles: ${error.message}`);
  return (data as Profile | null) ?? null;
}

export async function createProfile(input: CreateInput): Promise<CreateResult> {
  /* Idempotensi ada di keberadaan baris, bukan di `isNewUser` Privy.
     Orang yang menutup tab setelah login tapi sebelum memilih peran bukan
     user baru bagi Privy, tapi belum punya baris di sini. */
  const existing = await getProfile(input.privy_did);
  if (existing) return { ok: true, profile: existing };

  if (!supabase) {
    /* Keunikan nama musisi ditegakkan juga di memory, supaya jalur galat
       "nama sudah dipakai" bisa diuji sebelum tiket 08 selesai. */
    if (input.role === "artist" && nameTakenInMemory(input.display_name)) {
      return { ok: false, reason: "name-taken" };
    }
    const profile: Profile = {
      ...input,
      funded_at: null,
      created_at: new Date().toISOString(),
    };
    memory.set(input.privy_did, profile);
    return { ok: true, profile };
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert(input)
    .select()
    .single();

  if (error) {
    /* 23505 = unique_violation. Di tabel ini hanya dua yang bisa memicunya,
       dan cuma satu yang bisa dilihat orang: `profiles_artist_name_unique`
       (partial index, musisi saja — tiket 04). Yang satu lagi `wallet`,
       dan itu bug, bukan kesalahan user. */
    if (error.code === "23505" && error.message.includes("display_name")) {
      return { ok: false, reason: "name-taken" };
    }
    throw new Error(`gagal menulis profiles: ${error.message}`);
  }

  return { ok: true, profile: data as Profile };
}

function nameTakenInMemory(name: string): boolean {
  const lowered = name.toLowerCase();
  for (const p of memory.values()) {
    if (p.role === "artist" && p.display_name.toLowerCase() === lowered) {
      return true;
    }
  }
  return false;
}
