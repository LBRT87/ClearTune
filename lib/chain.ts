/* Monad testnet + config wagmi (tiket auth/05).

   `viem@2.55.10` sudah mengekspor `monadTestnet` dengan chain id 10143 dan
   RPC `https://testnet-rpc.monad.xyz` — persis nilai yang diriset di tiket
   02, jadi `defineChain` manual di riset itu tidak diperlukan. Diverifikasi
   langsung ke paket terpasang, bukan diasumsikan. */

import { http } from "viem";
import { monadTestnet } from "viem/chains";
import { createConfig } from "@privy-io/wagmi";

/* `createConfig` WAJIB dari `@privy-io/wagmi`, bukan dari `wagmi`.
   Versi Privy-nya yang tahu cara membaca state Privy; menukarnya membuat
   embedded wallet tidak pernah ikut terhubung ke wagmi. */
export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  transports: { [monadTestnet.id]: http() },
});

export { monadTestnet };
