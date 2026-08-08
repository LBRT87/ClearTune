import { NextRequest, NextResponse } from "next/server";
import { decodeEventLog } from "viem";
import { CLEARTUNE_ADDRESS, clearTuneAbi } from "@/lib/contracts";
import { getBackendWalletClient, getPublicClient } from "@/lib/serverWallet";
import { supabaseAdmin } from "@/lib/supabase";
import { recomputeWalletTrust } from "@/lib/trust/compute";

// Called from the player UI when a track finishes (or is skipped). Writes the
// play on-chain via the authorized backend signer, then write-throughs the
// result into Postgres with the correct status — see project-spec.md 4.2
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

  if (receipt.status !== "success") {
    return NextResponse.json({ error: "reportPlays reverted on-chain", txHash }, { status: 502 });
  }

  let status: "paid" | "skipped_low_balance" = "skipped_low_balance";
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({ abi: clearTuneAbi, data: log.data, topics: log.topics, eventName: "PlayPaid" });
      if (decoded.eventName === "PlayPaid") status = "paid";
    } catch {
      // not a PlayPaid log, ignore (could be PlaySkippedLowBalance, or unrelated)
    }
  }

  const db = supabaseAdmin();
  await db.from("plays").insert({
    wallet: listener,
    song_id: songId,
    duration_played: durationPlayed ?? null,
    completed: completed ?? false,
    status,
    tx_hash: txHash,
  });

  // Keeps wallet_stats.trust_score current so the trending chart's weighting
  // actually reflects recent behavior. Never blocks the response — trust
  // scoring failing shouldn't fail a payment that already settled on-chain.
  if (status === "paid") {
    try {
      await recomputeWalletTrust(db, listener);
    } catch {
      // best-effort; chart_cache will just use a stale/neutral score this round
    }
  }

  return NextResponse.json({ txHash, status });
}
