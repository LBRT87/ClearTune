"use client";

import { useAccount, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { CLEARTUNE_ADDRESS, clearTuneAbi } from "@/lib/contracts";

export function BalanceStatusBanner() {
  const { address, isConnected } = useAccount();

  const { data } = useReadContracts({
    contracts: [
      { address: CLEARTUNE_ADDRESS, abi: clearTuneAbi, functionName: "getConfig" },
      {
        address: CLEARTUNE_ADDRESS,
        abi: clearTuneAbi,
        functionName: "balance",
        args: address ? [address] : undefined,
      },
    ],
    query: { enabled: isConnected },
  });

  if (!isConnected) {
    return (
      <div className="status-line status-info mb-8">
        <div className="status-dot" />
        <div>
          <span className="text-[10px] font-display">CONNECT WALLET</span>
          <small className="block text-dim mt-1 text-base">
            Connect a wallet to see your balance and estimated plays left.
          </small>
        </div>
      </div>
    );
  }

  const config = data?.[0]?.result as [bigint, number, bigint] | undefined;
  const onchainBalance = data?.[1]?.result as bigint | undefined;

  const ratePerPlay = config?.[0] ?? 0n;
  const balance = onchainBalance ?? 0n;
  const remainingPlays = ratePerPlay > 0n ? balance / ratePerPlay : 0n;
  const balanceEmpty = ratePerPlay > 0n && balance < ratePerPlay;

  return (
    <div className={`status-line ${balanceEmpty ? "status-warn" : "status-ok"} mb-8 flex-wrap gap-4`}>
      <div className="status-dot" />
      <div className="flex-1">
        {balanceEmpty ? (
          <>
            <span className="text-[10px] font-display">BALANCE EMPTY</span>
            <small className="block text-dim mt-1 text-base">
              Playback stops or drops to a 30s preview. Top up again to keep listening — no
              free tier.
            </small>
          </>
        ) : (
          <>
            <span className="text-[10px] font-display">
              BALANCE {formatUnits(balance, 6)} mUSD &middot; ~{remainingPlays.toString()} PLAYS LEFT
            </span>
            <small className="block text-dim mt-1 text-base">Deducted from your balance on every play.</small>
          </>
        )}
      </div>
    </div>
  );
}
