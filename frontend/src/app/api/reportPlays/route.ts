import { NextRequest, NextResponse } from "next/server";
import { decodeEventLog } from "viem";
import { CLEARTUNE_ADDRESS, clearTuneAbi } from "@/lib/contracts";
import { getBackendWalletClient, getPublicClient } from "@/lib/serverWallet";
import { supabaseAdmin } from "@/lib/supabase";

// Called from the player UI when a track finishes (or is skipped). Writes the
// play on-chain via the authorized backend signer, then write-throughs the
// result into Postgres with the correct funded_by — see project-spec.md 4.2
// and section 9 ("Trust layer tidak pernah dipanggil untuk memutuskan apakah
// pembayaran diproses").
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { listener, songId, durationPlayed, completed } = body as {
    listener: `0x${string}`;
    songId: number;
    durationPlayed?: number;
    completed?: boolean;
  };

  if (!listener || !songId) {
    return NextResponse.json({ error: "listener and songId are required" }, { status: 400 });
  }

  const wallet = getBackendWalletClient();
  const publicClient = getPublicClient();

  const txHash = await wallet.writeContract({
    address: CLEARTUNE_ADDRESS,
    abi: clearTuneAbi,
    functionName: "reportPlays",
    args: [[{ listener, songId: BigInt(songId) }]],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  let fundedBy: "subscription" | "treasury" = "subscription";
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({ abi: clearTuneAbi, data: log.data, topics: log.topics, eventName: "PlayReported" });
      fundedBy = decoded.args.fundedBy === 1 ? "treasury" : "subscription";
    } catch {
      // not a PlayReported log, ignore
    }
  }

  const db = supabaseAdmin();
  await db.from("plays").insert({
    wallet: listener,
    song_id: songId,
    duration_played: durationPlayed ?? null,
    completed: completed ?? false,
    funded_by: fundedBy,
    tx_hash: txHash,
    status: receipt.status === "success" ? "confirmed" : "failed",
  });

  return NextResponse.json({ txHash, fundedBy, status: receipt.status });
}
