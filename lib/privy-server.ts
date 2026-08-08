/* Verifikasi sesi Privy di server (tiket auth/05, dipakai lagi oleh 06).

   KOREKSI TERHADAP RISET TIKET 02 — diverifikasi ke paket terpasang
   (`@privy-io/node@0.28.0`), bukan ke dokumentasi:

   1. Riset menulis `privy.utils().auth().verifyAuthToken(token)`.
      Yang benar: `verifyAccessToken` adalah FUNGSI berdiri sendiri yang
      diekspor dari root paket. `verifyAuthToken` masih ada tapi sudah
      ditandai `@deprecated`.
   2. Fungsi itu menuntut `verification_key` — sesuatu yang tidak ada di
      tiket mana pun. Tidak perlu jadi env var baru: endpoint JWKS publik
      `auth.privy.io/api/v1/apps/<app_id>/jwks.json` menjawab 200 dengan
      kunci ES256 (dicek untuk app ini), jadi `createRemoteJWKSet` cukup
      berbekal App ID yang memang sudah publik. Nol langkah HITL tambahan.

   `createRemoteJWKSet` melakukan cache dan rotasi kuncinya sendiri, jadi
   set-nya dibuat sekali di module scope. */

import { createRemoteJWKSet } from "jose";
import { verifyAccessToken } from "@privy-io/node";

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const appSecret = process.env.PRIVY_APP_SECRET;

export const isPrivyServerConfigured = Boolean(appId && appSecret);

const jwks = appId
  ? createRemoteJWKSet(
      new URL(`https://auth.privy.io/api/v1/apps/${appId}/jwks.json`),
    )
  : null;

/* Bentuk minimal yang kita butuhkan dari respons REST. Sengaja tidak
   memakai tipe `User` penuh dari SDK: kita cuma butuh satu alamat, dan
   menyalin seluruh union `LinkedAccount` ke sini tidak membuat apa pun
   lebih aman. */
type LinkedAccountLite = {
  type?: string;
  chain_type?: string;
  wallet_client_type?: string;
  connector_type?: string;
  address?: string;
};

/** DID pemilik token, atau `null` kalau token tidak ada / tidak sah.
 *  Ini satu-satunya sumber identitas di server — DID tidak pernah diterima
 *  dari body request, karena body bisa dikarang. */
export async function didFromAccessToken(
  accessToken: string | undefined,
): Promise<string | null> {
  if (!accessToken || !appId || !jwks) return null;
  try {
    const claims = await verifyAccessToken({
      access_token: accessToken,
      app_id: appId,
      verification_key: jwks,
    });
    return claims.user_id;
  } catch {
    return null;
  }
}

/** Alamat embedded wallet Ethereum milik DID ini, diambil dari server.
 *
 *  Diambil di server, bukan diterima dari klien: alamat inilah yang jadi
 *  `plays.wallet` di spec §4.3 dan tujuan drip di tiket 06, jadi ia tidak
 *  boleh bisa dikarang dari body request.
 *
 *  Khusus embedded (`isEmbeddedWalletLinkedAccount`), bukan `wallets[0]`
 *  dan bukan `user.wallet` — supaya alamat yang tercatat tidak bergeser
 *  hanya karena orang menghubungkan MetaMask (tiket 04).
 *
 *  `null` itu sah dan sudah diperhitungkan: kolomnya nullable karena
 *  pembuatan embedded wallet punya jeda yang tidak dijanjikan dokumentasi. */
export async function embeddedWalletFor(did: string): Promise<string | null> {
  if (!appId || !appSecret) return null;
  try {
    /* REST langsung, bukan `PrivyClient`. `PrivyClient.users()` yang publik
       hanya punya `get({id_token})` — dan identity token itu cookie lain
       (`privy-id-token`) yang harus dinyalakan terpisah di dashboard.
       Mengambil user lewat DID ada di `PrivyAPI.users._get`, kelas internal
       yang tidak diekspor dari root paket. Endpoint REST-nya stabil,
       terdokumentasi, dan auth-nya sudah terbukti dipakai tiket 01. */
    const res = await fetch(`https://auth.privy.io/api/v1/users/${did}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${appId}:${appSecret}`).toString("base64")}`,
        "privy-app-id": appId,
      },
      cache: "no-store",
    });
    if (!res.ok) return null;

    const user = (await res.json()) as { linked_accounts?: LinkedAccountLite[] };
    for (const account of user.linked_accounts ?? []) {
      if (
        account.type === "wallet" &&
        account.chain_type === "ethereum" &&
        account.wallet_client_type === "privy" &&
        account.address
      ) {
        return account.address;
      }
    }
    return null;
  } catch {
    /* Profil tanpa wallet lebih baik daripada pendaftaran yang gagal —
       kolomnya nullable justru untuk ini, dan tiket 06 mengisi ulang saat
       drip. */
    return null;
  }
}
