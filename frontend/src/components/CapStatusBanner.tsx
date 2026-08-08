"use client";

import { useAccount, useReadContracts } from "wagmi";
import { CLEARTUNE_ADDRESS, clearTuneAbi } from "@/lib/contracts";
import { Tag } from "@/components/ui/Tag";

export function CapStatusBanner() {
  const { address, isConnected } = useAccount();

  const { data } = useReadContracts({
    contracts: [
      { address: CLEARTUNE_ADDRESS, abi: clearTuneAbi, functionName: "getConfig" },
      {
        address: CLEARTUNE_ADDRESS,
        abi: clearTuneAbi,
        functionName: "playsThisMonth",
        args: address ? [address] : undefined,
      },
      {
        address: CLEARTUNE_ADDRESS,
        abi: clearTuneAbi,
        functionName: "autoRefillEnabled",
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
          <span className="text-[10px] font-display">HUBUNGKAN DOMPET</span>
          <small className="block text-dim mt-1 text-base">
            Sambungkan dompet untuk melihat sisa kuota play bulan ini.
          </small>
        </div>
      </div>
    );
  }

  const config = data?.[0]?.result as [bigint, bigint, number] | undefined;
  const played = data?.[1]?.result as bigint | undefined;
  const autoRefill = data?.[2]?.result as boolean | undefined;

  const cap = config?.[0] ?? 0n;
  const remaining = cap > (played ?? 0n) ? cap - (played ?? 0n) : 0n;
  const capReached = (played ?? 0n) >= cap;

  return (
    <div className={`status-line ${capReached ? "status-warn" : "status-ok"} mb-8 flex-wrap gap-4`}>
      <div className="status-dot" />
      <div className="flex-1">
        {capReached ? (
          <>
            <span className="text-[10px] font-display">MODE GRATIS AKTIF</span>
            <small className="block text-dim mt-1 text-base">
              Kuota bulan ini habis. Kamu tetap bisa dengar gratis — musisi tetap dibayar dari kas platform.
            </small>
          </>
        ) : (
          <>
            <span className="text-[10px] font-display">
              SISA {remaining.toString()} DARI {cap.toString()} PLAY BULAN INI
            </span>
            <small className="block text-dim mt-1 text-base">Dipotong dari saldo subscription kamu.</small>
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Tag variant={autoRefill ? "green" : "neutral"}>{autoRefill ? "AUTO-REFILL ON" : "AUTO-REFILL OFF"}</Tag>
      </div>
    </div>
  );
}
