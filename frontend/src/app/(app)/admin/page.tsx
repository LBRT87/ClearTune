"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { CLEARTUNE_ADDRESS, clearTuneAbi } from "@/lib/contracts";
import { Card, StatRow } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { StatusLine } from "@/components/ui/StatusLine";

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  const { data: owner } = useReadContract({ address: CLEARTUNE_ADDRESS, abi: clearTuneAbi, functionName: "owner" });
  const { data: treasury, refetch: refetchTreasury } = useReadContract({
    address: CLEARTUNE_ADDRESS,
    abi: clearTuneAbi,
    functionName: "treasury",
  });
  const { data: config, refetch: refetchConfig } = useReadContract({
    address: CLEARTUNE_ADDRESS,
    abi: clearTuneAbi,
    functionName: "getConfig",
  });

  const [ratePerPlay, setRatePerPlay] = useState("");
  const [feeBps, setFeeBps] = useState("");
  const [minTopUp, setMinTopUp] = useState("");
  const [withdrawTo, setWithdrawTo] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const isOwner = !!address && !!owner && address.toLowerCase() === (owner as string).toLowerCase();

  async function handleSave() {
    await writeContractAsync({
      address: CLEARTUNE_ADDRESS,
      abi: clearTuneAbi,
      functionName: "setConfig",
      args: [
        parseUnits(ratePerPlay || formatUnits(config?.[0] ?? 0n, 6), 6),
        Number(feeBps || config?.[1] || 0),
        parseUnits(minTopUp || formatUnits(config?.[2] ?? 0n, 6), 6),
      ],
    });
    refetchConfig();
  }

  async function handleWithdrawTreasury() {
    if (!withdrawTo || !withdrawAmount) return;
    await writeContractAsync({
      address: CLEARTUNE_ADDRESS,
      abi: clearTuneAbi,
      functionName: "withdrawTreasury",
      args: [withdrawTo as `0x${string}`, parseUnits(withdrawAmount, 6)],
    });
    setWithdrawAmount("");
    refetchTreasury();
  }

  if (!isConnected) {
    return (
      <main className="max-w-[1040px] mx-auto px-5 py-12">
        <StatusLine variant="info" label="HUBUNGKAN DOMPET" detail="Sambungkan dompet owner untuk masuk panel admin." />
      </main>
    );
  }

  if (!isOwner) {
    return (
      <main className="max-w-[1040px] mx-auto px-5 py-12">
        <StatusLine variant="err" label="AKSES DITOLAK" detail="Hanya owner kontrak yang bisa mengubah parameter." />
      </main>
    );
  }

  return (
    <main className="max-w-[1040px] mx-auto px-5 py-12">
      <h1 className="font-display text-xl mb-8">PANEL ADMIN</h1>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <Card eyebrow="KESEHATAN KAS">
          <StatRow label="Saldo treasury (fee terkumpul)" value={`${treasury !== undefined ? formatUnits(treasury as bigint, 6) : "—"} mUSD`} accent />
          <Button variant="outline" className="mt-4 w-auto" onClick={() => refetchTreasury()}>
            REFRESH
          </Button>
        </Card>
        <Card eyebrow="PARAMETER SAAT INI">
          <StatRow label="Rate per play" value={`${config ? formatUnits(config[0], 6) : "—"} mUSD`} />
          <StatRow label="Platform fee" value={`${config ? config[1] / 100 : "—"}%`} />
          <StatRow label="Minimum top up" value={`${config ? formatUnits(config[2], 6) : "—"} mUSD`} />
        </Card>
      </div>

      <Card eyebrow="UBAH PARAMETER" className="mb-8 max-w-none">
        <div className="flex gap-4 flex-wrap items-end">
          <Field label="RATE PER PLAY (mUSD)" type="text" placeholder={config ? formatUnits(config[0], 6) : ""} value={ratePerPlay} onChange={(e) => setRatePerPlay(e.target.value)} />
          <Field label="PLATFORM FEE (BPS)" type="number" placeholder={String(config?.[1] ?? "")} value={feeBps} onChange={(e) => setFeeBps(e.target.value)} />
          <Field label="MINIMUM TOP UP (mUSD)" type="text" placeholder={config ? formatUnits(config[2], 6) : ""} value={minTopUp} onChange={(e) => setMinTopUp(e.target.value)} />
        </div>
        <Button variant="purple" onClick={handleSave} disabled={isPending}>
          {isPending ? "MENYIMPAN..." : "SIMPAN PARAMETER"}
        </Button>
      </Card>

      <Card eyebrow="TARIK TREASURY" className="mb-8 max-w-none">
        <p className="text-lg text-dim mb-4">
          Fee platform yang terkumpul (8% tiap play) — bukan dana talangan, murni revenue platform.
        </p>
        <div className="flex gap-4 flex-wrap items-end">
          <Field label="TUJUAN (ADDRESS)" placeholder="0x..." value={withdrawTo} onChange={(e) => setWithdrawTo(e.target.value)} />
          <Field label="JUMLAH (mUSD)" type="text" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
        </div>
        <Button variant="success" onClick={handleWithdrawTreasury} disabled={isPending || !withdrawTo || !withdrawAmount}>
          {isPending ? "MEMPROSES..." : "TARIK TREASURY"}
        </Button>
      </Card>
    </main>
  );
}
