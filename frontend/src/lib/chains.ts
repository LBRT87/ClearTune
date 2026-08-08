import { defineChain } from "viem";

// Monad testnet. Values match the public testnet as of writing — if Monad
// rotates the RPC/explorer/chain id, override via the NEXT_PUBLIC_MONAD_*
// env vars rather than editing this file.
export const monadTestnet = defineChain({
  id: Number(process.env.NEXT_PUBLIC_MONAD_CHAIN_ID ?? 10143),
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_MONAD_RPC_URL ?? "https://testnet-rpc.monad.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Monad Explorer",
      url: process.env.NEXT_PUBLIC_MONAD_EXPLORER_URL ?? "https://testnet.monadexplorer.com",
    },
  },
  testnet: true,
});
