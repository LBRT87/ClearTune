import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { monadTestnet } from "./chains";

export const wagmiConfig = getDefaultConfig({
  appName: "ClearTune",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "REPLACE_WITH_WALLETCONNECT_PROJECT_ID",
  chains: [monadTestnet],
  ssr: true,
});
