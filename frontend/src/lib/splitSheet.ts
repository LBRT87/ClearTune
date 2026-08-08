import { getPublicClient } from "./serverWallet";
import { CLEARTUNE_ADDRESS, clearTuneAbi } from "./contracts";

export type SplitSheetRow = { address: `0x${string}`; bps: number };

export async function getSplitSheet(songIdOnchain: number): Promise<SplitSheetRow[]> {
  const client = getPublicClient();
  try {
    const [payees, bps] = (await client.readContract({
      address: CLEARTUNE_ADDRESS,
      abi: clearTuneAbi,
      functionName: "getSongPayees",
      args: [BigInt(songIdOnchain)],
    })) as readonly [readonly `0x${string}`[], readonly number[]];

    return payees.map((address, i) => ({ address, bps: bps[i] }));
  } catch {
    return [];
  }
}
