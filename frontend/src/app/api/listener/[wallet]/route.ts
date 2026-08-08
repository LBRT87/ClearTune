import { NextRequest, NextResponse } from "next/server";
import { getListenerProfile } from "@/lib/listenerProfile";

// Backs the dashboard's "artists you support" story bar — only exposes the
// subset of the listener profile needed client-side (no bigint fields).
export async function GET(_req: NextRequest, { params }: { params: { wallet: string } }) {
  const wallet = params.wallet;
  if (!wallet.startsWith("0x") || wallet.length !== 42) {
    return NextResponse.json({ error: "invalid wallet" }, { status: 400 });
  }

  const profile = await getListenerProfile(wallet as `0x${string}`);
  return NextResponse.json({ supportedArtists: profile.supportedArtists });
}
