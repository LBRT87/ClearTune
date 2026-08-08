"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/Button";
import { StatusLine } from "@/components/ui/StatusLine";

const EXPLORER_URL = process.env.NEXT_PUBLIC_MONAD_EXPLORER_URL ?? "https://testnet.monadexplorer.com";

export function PlayerControls({ songId }: { songId: number }) {
  const { address, isConnected } = useAccount();
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function reportPlay(completed: boolean) {
    if (!address) return;
    setState("loading");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/reportPlays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listener: address, songId, completed }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "failed to report play");
      setTxHash(json.txHash);
      setState("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "unknown error");
      setState("error");
    }
  }

  if (!isConnected) {
    return <StatusLine variant="info" label="HUBUNGKAN DOMPET" detail="Sambungkan dompet untuk memutar lagu." />;
  }

  return (
    <div>
      <div className="flex gap-4 mb-5">
        <Button variant="purple" disabled={state === "loading"} onClick={() => reportPlay(true)}>
          {state === "loading" ? "MEMPROSES..." : "PUTAR LAGU"}
        </Button>
        <Button variant="outline" disabled={state === "loading"} onClick={() => reportPlay(false)}>
          LEWATI
        </Button>
      </div>

      {state === "done" && txHash && (
        <StatusLine
          variant="ok"
          label="PLAY TERCATAT ON-CHAIN"
          detail={`tx: ${txHash.slice(0, 10)}...${txHash.slice(-6)}`}
        />
      )}
      {state === "done" && txHash && (
        <a
          className="text-purple underline text-lg mt-2 inline-block"
          href={`${EXPLORER_URL}/tx/${txHash}`}
          target="_blank"
          rel="noreferrer"
        >
          Lihat di block explorer →
        </a>
      )}
      {state === "error" && <StatusLine variant="err" label="GAGAL" detail={errorMsg ?? undefined} />}
    </div>
  );
}
