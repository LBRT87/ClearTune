import { http } from "viem";
import { createConfig } from "@privy-io/wagmi";
import { createConfig as createWagmiConfig } from "wagmi";
import { monadTestnet } from "./chains";

/* Config wagmi untuk Privy (effort auth).
 *
 * `createConfig` WAJIB diimpor dari `@privy-io/wagmi`, bukan dari `wagmi`
 * dan bukan lagi `getDefaultConfig` milik RainbowKit. Versi Privy-nya yang
 * tahu cara menyambungkan embedded wallet ke konteks wagmi.
 *
 * Yang TIDAK berubah: seluruh kode yang memakai hook wagmi standar
 * (`useAccount`, `useReadContract`, `useWriteContract`, …) tetap jalan apa
 * adanya — 12 file di app ini memakainya dan tidak satu pun perlu disentuh.
 * Itu memang alasan Privy dipasang di balik wagmi alih-alih dipakai
 * sendirian (spec §3.2).
 *
 * `projectId` WalletConnect tidak lagi dibutuhkan: pemilihan wallet
 * external sekarang ditangani modal Privy.
 */
export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  transports: { [monadTestnet.id]: http() },
});

/* Config wagmi POLOS, dipakai hanya kalau `NEXT_PUBLIC_PRIVY_APP_ID`
 * kosong.
 *
 * Alasannya konkret: `WagmiProvider` milik Privy menuntut `PrivyProvider`
 * di atasnya, jadi tanpa App ID rantai provider-nya tidak bisa berdiri.
 * Kalau saat itu kita tidak memasang apa pun, 12 halaman yang memakai
 * `useAccount` langsung mati dengan `useConfig must be used within
 * WagmiProvider` — dan itu ketahuan saat prerender `next build`, bukan
 * saat runtime.
 *
 * Dengan fallback ini, app tanpa App ID tetap berdiri: wallet tidak bisa
 * terhubung (tidak ada connector), tapi tidak ada halaman yang pecah.
 * Pola yang sama dipakai Supabase di repo ini — variabel kosong berarti
 * fitur mati, bukan halaman rusak.
 */
export const fallbackWagmiConfig = createWagmiConfig({
  chains: [monadTestnet],
  connectors: [],
  transports: { [monadTestnet.id]: http() },
});
