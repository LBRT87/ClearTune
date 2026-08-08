"use client";

import { useState } from "react";
import { keccak256 } from "viem";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { decodeEventLog } from "viem";
import { CLEARTUNE_ADDRESS, clearTuneAbi } from "@/lib/contracts";
import { supabase } from "@/lib/supabase";
import { uploadCover } from "@/lib/uploadCover";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { StatusLine } from "@/components/ui/StatusLine";
import { Card } from "@/components/ui/Card";

type PayeeRow = { address: string; bps: string };

export default function RegisterPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [duration, setDuration] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [payees, setPayees] = useState<PayeeRow[]>([{ address: "", bps: "10000" }]);
  const [status, setStatus] = useState<"idle" | "uploading" | "registering" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [songId, setSongId] = useState<number | null>(null);

  const bpsTotal = payees.reduce((sum, p) => sum + (Number(p.bps) || 0), 0);
  const bpsOk = bpsTotal === 10000;

  function updatePayee(i: number, field: keyof PayeeRow, value: string) {
    setPayees((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)));
  }

  function addPayee() {
    if (payees.length >= 10) return;
    setPayees((prev) => [...prev, { address: "", bps: "0" }]);
  }

  function removePayee(i: number) {
    setPayees((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address || !file || !bpsOk) return;
    setErrorMsg(null);

    try {
      setStatus("uploading");
      const path = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("audio").upload(path, file);
      if (uploadError) throw new Error(`upload failed: ${uploadError.message}`);
      const { data: publicUrl } = supabase.storage.from("audio").getPublicUrl(path);
      const coverUrl = coverFile ? await uploadCover(coverFile) : null;

      const bytes = new Uint8Array(await file.arrayBuffer());
      // Placeholder for real audio fingerprinting (e.g. chromaprint) — hashing the
      // file content is enough to demo duplicate-rejection today.
      const contentHash = keccak256(bytes);
      const fingerprint = contentHash;

      setStatus("registering");
      const txHash = await writeContractAsync({
        address: CLEARTUNE_ADDRESS,
        abi: clearTuneAbi,
        functionName: "registerSong",
        args: [
          fingerprint,
          contentHash,
          publicUrl.publicUrl,
          payees.map((p) => p.address as `0x${string}`),
          payees.map((p) => Number(p.bps)),
        ],
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
      let newSongId: number | null = null;
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({ abi: clearTuneAbi, data: log.data, topics: log.topics, eventName: "SongRegistered" });
          newSongId = Number(decoded.args.songId);
        } catch {
          // not our event
        }
      }
      if (!newSongId) throw new Error("couldn't find songId in the event log");

      await fetch("/api/songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          songIdOnchain: newSongId,
          title,
          artist,
          duration: duration ? Number(duration) : null,
          storageUrl: publicUrl.publicUrl,
          coverUrl,
        }),
      });

      setSongId(newSongId);
      setStatus("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "unknown error");
      setStatus("error");
    }
  }

  return (
    <main className="max-w-[720px] mx-auto px-5 py-12">
      <h1 className="font-display text-xl mb-8">REGISTER A SONG</h1>

      {!isConnected && <StatusLine variant="info" label="CONNECT WALLET" detail="You need a wallet to register a song." />}

      {isConnected && (
        <form onSubmit={handleSubmit}>
          <Field label="SONG TITLE" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Field label="ARTIST" value={artist} onChange={(e) => setArtist(e.target.value)} required />
          <Field label="DURATION (SECONDS)" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />

          <div className="field max-w-[340px] mb-5">
            <label>AUDIO FILE</label>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-lg"
              required
            />
          </div>

          <div className="field max-w-[340px] mb-5">
            <label>COVER ART (OPTIONAL)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              className="text-lg"
            />
          </div>

          <Card eyebrow="SPLIT SHEET" className="mb-6 max-w-none">
            {payees.map((p, i) => (
              <div key={i} className="flex gap-3 items-end mb-4 flex-wrap">
                <Field
                  label={`PAYEE #${i + 1} ADDRESS`}
                  placeholder="0x..."
                  value={p.address}
                  onChange={(e) => updatePayee(i, "address", e.target.value)}
                  required
                />
                <Field
                  label="BPS"
                  type="number"
                  value={p.bps}
                  onChange={(e) => updatePayee(i, "bps", e.target.value)}
                  required
                />
                {payees.length > 1 && (
                  <Button type="button" variant="danger" onClick={() => removePayee(i)}>
                    REMOVE
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addPayee} disabled={payees.length >= 10}>
              + ADD PAYEE
            </Button>
            <p className={`mt-4 text-lg ${bpsOk ? "text-green" : "text-red"}`}>
              Total BPS: {bpsTotal} / 10000 {bpsOk ? "✓" : "— must be exactly 10000"}
            </p>
          </Card>

          <Button type="submit" variant="purple" disabled={!bpsOk || status === "uploading" || status === "registering"}>
            {status === "uploading" ? "UPLOADING..." : status === "registering" ? "REGISTERING..." : "REGISTER SONG"}
          </Button>

          {status === "done" && songId && (
            <div className="mt-6">
              <StatusLine variant="ok" label="SONG REGISTERED" detail={`Song ID #${songId}`} />
            </div>
          )}
          {status === "error" && (
            <div className="mt-6">
              <StatusLine variant="err" label="FAILED" detail={errorMsg ?? undefined} />
            </div>
          )}
        </form>
      )}
    </main>
  );
}
