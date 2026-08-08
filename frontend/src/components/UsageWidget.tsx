"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { CLEARTUNE_ADDRESS, clearTuneAbi, MOCKUSD_ADDRESS, mockUsdAbi } from "@/lib/contracts";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Card, StatRow } from "@/components/ui/Card";
import { StatusLine } from "@/components/ui/StatusLine";

export function UsageWidget() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const [amount, setAmount] = useState("50");
  const [confirmRefill, setConfirmRefill] = useState(false);

  const { data: mUsdBalance, refetch: refetchBalance } = useReadContract({
    address: MOCKUSD_ADDRESS,
    abi: mockUsdAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: subBalance, refetch: refetchSub } = useReadContract({
    address: CLEARTUNE_ADDRESS,
    abi: clearTuneAbi,
    functionName: "subBalance",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: autoRefill, refetch: refetchAutoRefill } = useReadContract({
    address: CLEARTUNE_ADDRESS,
    abi: clearTuneAbi,
    functionName: "autoRefillEnabled",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: playsThisMonth } = useReadContract({
    address: CLEARTUNE_ADDRESS,
    abi: clearTuneAbi,
    functionName: "playsThisMonth",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: config } = useReadContract({
    address: CLEARTUNE_ADDRESS,
    abi: clearTuneAbi,
    functionName: "getConfig",
  });

  async function handleFaucet() {
    await writeContractAsync({ address: MOCKUSD_ADDRESS, abi: mockUsdAbi, functionName: "faucet" });
    refetchBalance();
  }

  async function handleSubscribe() {
    const value = parseUnits(amount || "0", 6);
    if (value === 0n) return;
    await writeContractAsync({ address: MOCKUSD_ADDRESS, abi: mockUsdAbi, functionName: "approve", args: [CLEARTUNE_ADDRESS, value] });
    await writeContractAsync({ address: CLEARTUNE_ADDRESS, abi: clearTuneAbi, functionName: "subscribe", args: [value] });
    refetchBalance();
    refetchSub();
  }

  async function handleToggleAutoRefill(next: boolean) {
    await writeContractAsync({ address: CLEARTUNE_ADDRESS, abi: clearTuneAbi, functionName: "toggleAutoRefill", args: [next] });
    setConfirmRefill(false);
    refetchAutoRefill();
  }

  if (!isConnected) {
    return <StatusLine variant="info" label="HUBUNGKAN DOMPET" detail="Sambungkan dompet untuk lihat pemakaian & top up." />;
  }

  const playCap = config?.[0] ?? 0n;
  const used = (playsThisMonth as bigint) ?? 0n;
  const pct = playCap > 0n ? Math.min(100, Number((used * 100n) / playCap)) : 0;
  const barColor = pct >= 100 ? "#ff5c5c" : pct >= 70 ? "#ffe14d" : "#4ade80";

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card eyebrow="PEMAKAIAN BULAN INI" className="md:col-span-2">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-lg text-dim">
            {used.toString()} / {playCap.toString()} play
          </span>
          <span className="font-display text-[13px]" style={{ color: barColor }}>
            {pct}%
          </span>
        </div>
        <div className="usage-bar">
          <div className="usage-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
        </div>
        <p className="text-dim text-base mt-3">
          {pct >= 100
            ? "Kuota abis — sekarang jalan di mode gratis (dibayarin kas platform), kecuali auto-refill aktif."
            : "Sisa kuota bulan ini sebelum jatuh ke mode gratis / auto-refill."}
        </p>
      </Card>

      <Card eyebrow="SALDO">
        <StatRow label="Saldo mUSD dompet" value={`${mUsdBalance !== undefined ? formatUnits(mUsdBalance as bigint, 6) : "—"} mUSD`} />
        <StatRow label="Saldo subscription (di kontrak)" value={`${subBalance !== undefined ? formatUnits(subBalance as bigint, 6) : "—"} mUSD`} accent />
        <Button variant="outline" className="mt-4 w-auto" onClick={handleFaucet} disabled={isPending}>
          FAUCET (+1000 mUSD DEMO)
        </Button>
      </Card>

      <Card eyebrow="TOP UP">
        <Field label="JUMLAH (mUSD)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Button variant="purple" onClick={handleSubscribe} disabled={isPending}>
          {isPending ? "MEMPROSES..." : "TOP UP"}
        </Button>

        <div className="mt-8 pt-6 border-t border-dashed border-dim">
          <p className="text-lg mb-4">
            Auto-refill:{" "}
            <b className={autoRefill ? "text-green" : "text-dim"}>{autoRefill ? "AKTIF" : "NONAKTIF (default)"}</b>
          </p>
          {!autoRefill && !confirmRefill && (
            <Button variant="warn" onClick={() => setConfirmRefill(true)}>
              AKTIFKAN AUTO-REFILL
            </Button>
          )}
          {!autoRefill && confirmRefill && (
            <div>
              <p className="text-lg text-yellow mb-4">
                Setelah kuota habis, saldo subscription kamu akan otomatis dipakai lagi — bukan lagi mode gratis.
                Yakin?
              </p>
              <div className="flex gap-3">
                <Button variant="warn" onClick={() => handleToggleAutoRefill(true)} disabled={isPending}>
                  YA, AKTIFKAN
                </Button>
                <Button variant="outline" onClick={() => setConfirmRefill(false)}>
                  BATAL
                </Button>
              </div>
            </div>
          )}
          {autoRefill && (
            <Button variant="danger" onClick={() => handleToggleAutoRefill(false)} disabled={isPending}>
              MATIKAN AUTO-REFILL
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
