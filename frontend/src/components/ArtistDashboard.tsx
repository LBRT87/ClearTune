"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useReadContract, useReadContracts, useWriteContract } from "wagmi";
import { formatUnits } from "viem";
import { CLEARTUNE_ADDRESS, clearTuneAbi } from "@/lib/contracts";
import { supabase } from "@/lib/supabase";
import type { SongRow } from "@/lib/songs";
import { Button } from "@/components/ui/Button";
import { Card, StatRow } from "@/components/ui/Card";
import { StatusLine } from "@/components/ui/StatusLine";
import { RevenueSplitChart } from "@/components/charts/RevenueSplitChart";
import { SongPlaysChart } from "@/components/charts/SongPlaysChart";

type PlayAgg = { song_id: number; funded_by: "subscription" | "treasury"; count: number };

export function ArtistDashboard({ songs }: { songs: SongRow[] }) {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  const { data: earned, refetch: refetchEarned } = useReadContract({
    address: CLEARTUNE_ADDRESS,
    abi: clearTuneAbi,
    functionName: "earned",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: config } = useReadContract({
    address: CLEARTUNE_ADDRESS,
    abi: clearTuneAbi,
    functionName: "getConfig",
  });

  const { data: payeeChecks } = useReadContracts({
    contracts: songs.map((s) => ({
      address: CLEARTUNE_ADDRESS,
      abi: clearTuneAbi,
      functionName: "getSongPayees" as const,
      args: [BigInt(s.song_id_onchain)] as const,
    })),
    query: { enabled: songs.length > 0 },
  });

  const mySongs = useMemo(() => {
    if (!payeeChecks || !address) return [];
    return songs.filter((s, i) => {
      const result = payeeChecks[i]?.result as [readonly `0x${string}`[], readonly number[]] | undefined;
      if (!result) return false;
      const [payees] = result;
      return payees.some((p) => p.toLowerCase() === address.toLowerCase());
    });
  }, [songs, payeeChecks, address]);

  const [plays, setPlays] = useState<PlayAgg[]>([]);

  useEffect(() => {
    if (mySongs.length === 0) {
      setPlays([]);
      return;
    }
    const songIds = mySongs.map((s) => s.song_id_onchain);
    supabase
      .from("plays")
      .select("song_id, funded_by")
      .in("song_id", songIds)
      .then(({ data }) => {
        if (!data) return;
        const grouped = new Map<string, PlayAgg>();
        for (const row of data as { song_id: number; funded_by: "subscription" | "treasury" }[]) {
          const key = `${row.song_id}-${row.funded_by}`;
          const existing = grouped.get(key);
          if (existing) existing.count += 1;
          else grouped.set(key, { song_id: row.song_id, funded_by: row.funded_by, count: 1 });
        }
        setPlays(Array.from(grouped.values()));
      });
  }, [mySongs]);

  if (!isConnected) {
    return <StatusLine variant="info" label="HUBUNGKAN DOMPET" detail="Sambungkan dompet untuk melihat dashboard." />;
  }

  const ratePerPlay = config?.[1] ?? 0n;
  const subscriptionPlays = plays.filter((p) => p.funded_by === "subscription").reduce((s, p) => s + p.count, 0);
  const treasuryPlays = plays.filter((p) => p.funded_by === "treasury").reduce((s, p) => s + p.count, 0);

  async function handleWithdraw() {
    await writeContractAsync({ address: CLEARTUNE_ADDRESS, abi: clearTuneAbi, functionName: "withdraw" });
    refetchEarned();
  }

  const songPlayTotals = mySongs
    .map((s) => ({
      title: s.title,
      plays: plays.filter((p) => p.song_id === s.song_id_onchain).reduce((sum, p) => sum + p.count, 0),
    }))
    .sort((a, b) => b.plays - a.plays);

  return (
    <div>
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <Card eyebrow="SALDO BISA DITARIK">
          <p className="font-display text-2xl text-purple mb-6">
            {earned !== undefined ? formatUnits(earned as bigint, 6) : "—"} mUSD
          </p>
          <Button variant="success" onClick={handleWithdraw} disabled={isPending || !earned || earned === 0n}>
            {isPending ? "MEMPROSES..." : "TARIK SALDO"}
          </Button>
        </Card>
        <Card eyebrow="RINCIAN SUMBER PENDAPATAN">
          <StatRow label="Dari subscription pendengar" value={`${subscriptionPlays} play`} />
          <StatRow label="Dari kas platform (play gratis)" value={`${treasuryPlays} play`} accent />
          <StatRow label="Tarif per play saat ini" value={`${formatUnits(ratePerPlay, 6)} mUSD`} />
        </Card>
      </div>

      <h2 className="font-display text-sm mb-6">ANALITIK</h2>
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <Card eyebrow="LAGU PALING BANYAK DIDENGAR">
          <SongPlaysChart data={songPlayTotals} />
        </Card>
        <Card eyebrow="SUMBER PENDAPATAN">
          <RevenueSplitChart subscription={subscriptionPlays} treasury={treasuryPlays} />
        </Card>
      </div>

      <h2 className="font-display text-sm mb-6">LAGU SAYA</h2>
      {mySongs.length === 0 && <p className="text-dim text-lg">Belum ada lagu terdaftar dengan dompet ini.</p>}
      <div className="grid md:grid-cols-3 gap-6">
        {mySongs.map((song) => {
          const songPlays = plays.filter((p) => p.song_id === song.song_id_onchain);
          const total = songPlays.reduce((s, p) => s + p.count, 0);
          return (
            <Card key={song.song_id_onchain} eyebrow={`LAGU #${song.song_id_onchain}`} title={song.title.toUpperCase()}>
              <StatRow label="Play total" value={String(total)} />
              <StatRow
                label="Dari subscription"
                value={String(songPlays.find((p) => p.funded_by === "subscription")?.count ?? 0)}
              />
              <StatRow
                label="Dari treasury"
                value={String(songPlays.find((p) => p.funded_by === "treasury")?.count ?? 0)}
                accent
              />
            </Card>
          );
        })}
      </div>
    </div>
  );
}
