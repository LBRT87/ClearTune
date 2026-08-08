"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { CLEARTUNE_ADDRESS, clearTuneAbi, MOCKUSD_ADDRESS, mockUsdAbi } from "@/lib/contracts";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Card, StatRow } from "@/components/ui/Card";
import { StatusLine } from "@/components/ui/StatusLine";

export function TopUpWidget() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const [amount, setAmount] = useState("50");

  const { data: mUsdBalance, refetch: refetchBalance } = useReadContract({
    address: MOCKUSD_ADDRESS,
    abi: mockUsdAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: onchainBalance, refetch: refetchOnchainBalance } = useReadContract({
    address: CLEARTUNE_ADDRESS,
    abi: clearTuneAbi,
    functionName: "balance",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: config } = useReadContract({
    address: CLEARTUNE_ADDRESS,
    abi: clearTuneAbi,
    functionName: "getConfig",
  });

  const minTopUp = config?.[2];

  async function handleFaucet() {
    await writeContractAsync({ address: MOCKUSD_ADDRESS, abi: mockUsdAbi, functionName: "faucet" });
    refetchBalance();
  }

  async function handleTopUp() {
    const value = parseUnits(amount || "0", 6);
    if (value === 0n) return;
    await writeContractAsync({ address: MOCKUSD_ADDRESS, abi: mockUsdAbi, functionName: "approve", args: [CLEARTUNE_ADDRESS, value] });
    await writeContractAsync({ address: CLEARTUNE_ADDRESS, abi: clearTuneAbi, functionName: "topUp", args: [value] });
    refetchBalance();
    refetchOnchainBalance();
  }

  if (!isConnected) {
    return <StatusLine variant="info" label="CONNECT WALLET" detail="Connect a wallet to top up your balance." />;
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card eyebrow="BALANCE">
        <StatRow label="Wallet mUSD balance" value={`${mUsdBalance !== undefined ? formatUnits(mUsdBalance as bigint, 6) : "—"} mUSD`} />
        <StatRow label="Contract balance (for plays)" value={`${onchainBalance !== undefined ? formatUnits(onchainBalance as bigint, 6) : "—"} mUSD`} accent />
        <Button variant="outline" className="mt-4 w-auto" onClick={handleFaucet} disabled={isPending}>
          FAUCET (+1000 mUSD DEMO)
        </Button>
      </Card>

      <Card eyebrow="TOP UP BALANCE">
        <Field label="AMOUNT (mUSD)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        {minTopUp !== undefined && (
          <p className="text-dim text-base mb-4">Minimum top up: {formatUnits(minTopUp, 6)} mUSD</p>
        )}
        <Button variant="purple" onClick={handleTopUp} disabled={isPending}>
          {isPending ? "PROCESSING..." : "TOP UP"}
        </Button>

        <div className="mt-8 pt-6 border-t border-dashed border-dim">
          <p className="text-lg">
            Balance empty? Playback stops or drops to a preview — no free tier, no silent
            auto-refill. Top up manually anytime, right here.
          </p>
        </div>
      </Card>
    </div>
  );
}
