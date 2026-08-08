"use client";

/* Provider aplikasi (effort auth).
 *
 * RainbowKit diganti Privy. Alasannya bukan selera: model identitas produk
 * ini adalah "login Google, dompetnya dibuatkan" — orang yang mau
 * mendengarkan musik tidak punya MetaMask, dan menuntutnya adalah tembok
 * di langkah pertama. Privy tetap melayani wallet external, jadi yang
 * hilang cuma keharusan punya wallet, bukan kemampuannya.
 *
 * Urutan bersarang TIDAK BOLEH ditukar: `WagmiProvider` dari
 * `@privy-io/wagmi` membaca state Privy, jadi ia harus di dalam
 * `PrivyProvider`.
 *
 * Tanpa `NEXT_PUBLIC_PRIVY_APP_ID`, app tetap dirender — hanya jalur auth
 * yang padam. Pola yang sama dipakai Supabase di repo ini: variabel kosong
 * berarti fitur mati, bukan halaman rusak.
 */

import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { WagmiProvider as BaseWagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { fallbackWagmiConfig, wagmiConfig } from "@/lib/wagmi";

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

export const isPrivyConfigured = Boolean(appId);

export function Providers({ children }: { children: React.ReactNode }) {
  /* Satu instance per mount, bukan module scope: cache tidak bocor antar
     user saat dev server hot-reload. */
  const [queryClient] = useState(() => new QueryClient());

  /* Tanpa App ID, wagmi TETAP dipasang — dengan config polos tanpa
     connector. Menghilangkan WagmiProvider di sini membuat 12 halaman yang
     memakai `useAccount` mati saat prerender. */
  if (!appId) {
    return (
      <QueryClientProvider client={queryClient}>
        <BaseWagmiProvider config={fallbackWagmiConfig}>
          {children}
        </BaseWagmiProvider>
      </QueryClientProvider>
    );
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        /* `wallet` tetap ada supaya orang yang MEMANG punya wallet tidak
           kehilangan jalurnya saat RainbowKit dilepas. Email adalah jaring
           pengaman: Google OAuth bisa mati di in-app browser (webview
           chat). Daftar ini membatasi, bukan mengaktifkan — metodenya tetap
           harus dinyalakan di dashboard Privy. */
        loginMethods: ["google", "email", "wallet"],
        embeddedWallets: { ethereum: { createOnLogin: "users-without-wallets" } },
        appearance: {
          theme: "dark",
          accentColor: "#8b5cf6",
          walletChainType: "ethereum-only",
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
