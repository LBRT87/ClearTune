"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SupportedArtist } from "@/lib/listenerProfile";

export function TopArtistsChart({ data }: { data: SupportedArtist[] }) {
  const top = data.slice(0, 8);
  if (top.length === 0) {
    return <p className="text-dim text-lg py-8">No artists supported yet.</p>;
  }

  return (
    <div style={{ width: "100%", height: 240 }}>
      <ResponsiveContainer>
        <BarChart data={top} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="#241033" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="artist" stroke="#9a9a9a" fontSize={12} fontFamily="var(--font-vt323)" tickLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
          <YAxis stroke="#9a9a9a" fontSize={12} fontFamily="var(--font-vt323)" allowDecimals={false} tickLine={false} width={30} />
          <Tooltip
            contentStyle={{ background: "#000000", border: "2px solid #ffffff", fontFamily: "var(--font-vt323)" }}
            labelStyle={{ color: "#9a9a9a" }}
            itemStyle={{ color: "#4ade80" }}
            cursor={{ fill: "rgba(139, 92, 246, 0.1)" }}
          />
          <Bar dataKey="plays" fill="#4ade80" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
