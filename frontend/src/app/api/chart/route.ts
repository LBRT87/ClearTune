import { NextResponse } from "next/server";
import { computeTrendingChart } from "@/lib/chart";

export async function GET() {
  const chart = await computeTrendingChart();
  return NextResponse.json({ chart });
}
