/* API profil (tiket auth/05).

   Peran ditulis lewat route ini, tidak pernah dari klien — klien tidak
   punya `service_role` dan tidak boleh punya.

   Batas dengan tiket 06: route ini MEMBUAT baris profil, titik. Drip MON
   (`funded_at`) milik tiket 06 dan seam-nya ditandai di bawah. */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  didFromAccessToken,
  embeddedWalletFor,
  isPrivyServerConfigured,
} from "@/lib/privy-server";
import { createProfile, getProfile, profileBackend } from "@/lib/profiles";
import type { Role } from "@/lib/profile-types";

/* Route ini membaca cookie, jadi ia tidak akan pernah bisa dirender
   statis — dinyatakan eksplisit supaya `next build` tidak mencoba. */
export const dynamic = "force-dynamic";

const MAX_NAME = 24;

function unconfigured() {
  return NextResponse.json(
    { error: "privy-unconfigured", backend: profileBackend },
    { status: 503 },
  );
}

/** Sudah punya peran atau belum. Ini SATU-SATUNYA sumber kebenaran untuk
 *  "sudah punya peran" — bukan `isNewUser` milik Privy, yang menjawab
 *  pertanyaan berbeda ("baru di Privy") dan meleset persis pada orang yang
 *  menutup tab setelah login sebelum memilih peran. */
export async function GET() {
  if (!isPrivyServerConfigured) return unconfigured();

  const did = await didFromAccessToken(cookies().get("privy-token")?.value);
  if (!did) return NextResponse.json({ profile: null, backend: profileBackend });

  const profile = await getProfile(did);
  return NextResponse.json({ profile, backend: profileBackend });
}

export async function POST(request: Request) {
  if (!isPrivyServerConfigured) return unconfigured();

  const did = await didFromAccessToken(cookies().get("privy-token")?.value);
  if (!did) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  let body: { role?: string; display_name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad-body" }, { status: 400 });
  }

  const role = body.role;
  if (role !== "artist" && role !== "listener") {
    return NextResponse.json({ error: "bad-role" }, { status: 400 });
  }

  const displayName = (body.display_name ?? "").trim();
  if (!displayName) {
    return NextResponse.json({ error: "name-empty" }, { status: 400 });
  }
  if (displayName.length > MAX_NAME) {
    return NextResponse.json({ error: "name-too-long" }, { status: 400 });
  }

  /* Alamat wallet diambil dari server memakai DID hasil verifikasi, bukan
     dari body — kalau klien boleh menyebut alamatnya sendiri, ia bisa
     mengarahkan drip tiket 06 ke mana pun. */
  const wallet = await embeddedWalletFor(did);

  const result = await createProfile({
    privy_did: did,
    wallet,
    role: role as Role,
    display_name: displayName,
  });

  if (!result.ok) {
    /* 409, bukan 500: ini kesalahan yang bisa diperbaiki orangnya sendiri
       dengan mengetik nama lain, dan layar pilih peran menampilkannya di
       dalam field tanpa melempar dia keluar. */
    return NextResponse.json({ error: result.reason }, { status: 409 });
  }

  /* SEAM TIKET 06 — drip MON.
     Di sinilah `funded_at IS NULL` dibaca dan MON dikirim ke
     `result.profile.wallet`. Sengaja belum dikerjakan: tanpa
     DEPLOYER_PRIVATE_KEY tidak ada yang bisa dikirim, dan memalsukannya
     akan membuat dashboard menampilkan saldo yang tidak pernah ada. */

  return NextResponse.json({ profile: result.profile, backend: profileBackend });
}
