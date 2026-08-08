import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { recomputeWalletTrust } from "@/lib/trust/compute";

// Trust layer never blocks payment — it only computes a score that later feeds
// chart_cache.weighted_score. See project-spec.md section 9.
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) {
    return NextResponse.json({ error: "missing ?wallet=" }, { status: 400 });
  }

  const result = await recomputeWalletTrust(supabaseAdmin(), wallet);
  return NextResponse.json(result);
}
