import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { monadTestnet } from "./chains";

// Server-only. The backend signer is the address authorized via
// ClearTune.setBackend(...) — it's the only account allowed to call
// reportPlays(). Never import this file from a client component.
export function getBackendAccount() {
  const key = process.env.BACKEND_PRIVATE_KEY;
  if (!key) throw new Error("BACKEND_PRIVATE_KEY is not set");
  return privateKeyToAccount(key as `0x${string}`);
}

export function getPublicClient() {
  return createPublicClient({ chain: monadTestnet, transport: http() });
}

export function getBackendWalletClient() {
  return createWalletClient({ account: getBackendAccount(), chain: monadTestnet, transport: http() });
}
