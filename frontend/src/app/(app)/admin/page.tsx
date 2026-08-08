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

  const [playCap, setPlayCap] = useState("");
  const [ratePerPlay, setRatePerPlay] = useState("");
  const [feeBps, setFeeBps] = useState("");

  const isOwner = !!address && !!owner && address.toLowerCase() === (owner as string).toLowerCase();

  async function handleSave() {
    await writeContractAsync({
      address: CLEARTUNE_ADDRESS,
      abi: clearTuneAbi,
      functionName: "setConfig",
      args: [
        BigInt(playCap || config?.[0] || 0),
        parseUnits(ratePerPlay || formatUnits(config?.[1] ?? 0n, 6), 6),
        Number(feeBps || config?.[2] || 0),
      ],
    });
    refetchConfig();
  }

  async function handleAdvancePeriod() {
    await writeContractAsync({ address: CLEARTUNE_ADDRESS, abi: clearTuneAbi, functionName: "advancePeriod" });
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
          <StatRow label="Saldo treasury" value={`${treasury !== undefined ? formatUnits(treasury as bigint, 6) : "—"} mUSD`} accent />
          <Button variant="outline" className="mt-4 w-auto" onClick={() => refetchTreasury()}>
            REFRESH
          </Button>
        </Card>
        <Card eyebrow="PARAMETER SAAT INI">
          <StatRow label="Play cap" value={String(config?.[0] ?? "—")} />
          <StatRow label="Rate per play" value={`${config ? formatUnits(config[1], 6) : "—"} mUSD`} />
          <StatRow label="Platform fee" value={`${config ? config[2] / 100 : "—"}%`} />
        </Card>
      </div>

      <Card eyebrow="UBAH PARAMETER" className="mb-8 max-w-none">
        <div className="flex gap-4 flex-wrap items-end">
          <Field label="PLAY CAP" type="number" placeholder={String(config?.[0] ?? "")} value={playCap} onChange={(e) => setPlayCap(e.target.value)} />
          <Field label="RATE PER PLAY (mUSD)" type="text" placeholder={config ? formatUnits(config[1], 6) : ""} value={ratePerPlay} onChange={(e) => setRatePerPlay(e.target.value)} />
          <Field label="PLATFORM FEE (BPS)" type="number" placeholder={String(config?.[2] ?? "")} value={feeBps} onChange={(e) => setFeeBps(e.target.value)} />
        </div>
        <Button variant="purple" onClick={handleSave} disabled={isPending}>
          {isPending ? "MENYIMPAN..." : "SIMPAN PARAMETER"}
        </Button>
      </Card>

      <Card eyebrow="DEV / DEMO">
        <p className="text-lg text-dim mb-4">
          Percepat simulasi bulan berjalan tanpa menunggu — mereset kuota play semua dompet secara lazy.
        </p>
        <Button variant="warn" onClick={handleAdvancePeriod} disabled={isPending}>
          ADVANCE PERIOD
        </Button>
      </Card>
    </main>
  );
}
