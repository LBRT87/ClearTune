"use client";

/* Provider auth (tiket auth/05).

   Urutan bersarang TIDAK BOLEH ditukar: `WagmiProvider` dari
   `@privy-io/wagmi` membaca state Privy, jadi ia harus berada di dalam
   `PrivyProvider`.  PrivyProvider → QueryClientProvider → WagmiProvider.

   `'use client'` di file ini hanya menandai file ini dan turunannya
   sebagai client entry point. `children` yang dioper dari `app/layout.tsx`
   (server component) tetap dirender di server — landing page `/` tidak
   berubah statusnya dan tidak butuh perlakuan khusus. */

import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { wagmiConfig } from "@/lib/chain";

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

/** Tanpa App ID, halaman tetap jalan — pola yang sama seperti Supabase di
 *  `.env.example`. Yang hilang cuma auth-nya, bukan seluruh situsnya. */
export const isPrivyConfigured = Boolean(appId);

export default function Providers({ children }: { children: React.ReactNode }) {
  /* QueryClient dibuat di state, bukan di module scope: satu instance per
     mount, supaya cache tidak bocor antar user saat dev server hot-reload. */
  const [queryClient] = useState(() => new QueryClient());

  if (!appId) return <>{children}</>;

  return (
    <PrivyProvider
      appId={appId}
      config={{
        /* Pembatas, bukan pengaktif — metode tetap harus dinyalakan di
           dashboard Privy (tiket 01). Email adalah jaring pengaman untuk
           in-app browser, tempat Google OAuth bisa mati. */
        loginMethods: ["google", "email"],
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
