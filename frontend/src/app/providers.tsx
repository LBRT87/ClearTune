"use client";

import { useEffect } from "react";
import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";

const queryClient = new QueryClient();

// WalletConnect's relay tries to open a connection on mount, before the user
// ever clicks "Connect Wallet". Without a real NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
// (see .env.local.example) that always fails and throws an unhandled promise
// rejection, which Next.js surfaces as a full-screen red dev error overlay —
// looks like the whole app crashed, but only wallet-connect is affected.
// Swallow just this one known, harmless error instead of the whole page
// going red. Safe to delete once a real project id is configured.
function useSuppressWalletConnectRelayError() {
  useEffect(() => {
    function onRejection(event: PromiseRejectionEvent) {
      const message = event.reason instanceof Error ? event.reason.message : String(event.reason);
      if (message.includes("Connection interrupted while trying to subscribe")) {
        event.preventDefault();
      }
    }
    window.addEventListener("unhandledrejection", onRejection);
    return () => window.removeEventListener("unhandledrejection", onRejection);
  }, []);
}

export function Providers({ children }: { children: React.ReactNode }) {
  useSuppressWalletConnectRelayError();

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#8b5cf6",
            accentColorForeground: "#000000",
            borderRadius: "none",
            fontStack: "system",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
