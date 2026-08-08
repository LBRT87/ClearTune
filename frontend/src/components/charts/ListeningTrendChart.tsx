"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PlaysByDay } from "@/lib/listenerProfile";

export function ListeningTrendChart({ data }: { data: PlaysByDay[] }) {
  if (data.length === 0) {
    return <p className="text-dim text-lg py-8">No listening history to chart yet.</p>;
  }

  return (
    <div style={{ width: "100%", height: 220 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="playsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#241033" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="date" stroke="#9a9a9a" fontSize={12} fontFamily="var(--font-vt323)" tickLine={false} />
          <YAxis stroke="#9a9a9a" fontSize={12} fontFamily="var(--font-vt323)" allowDecimals={false} tickLine={false} width={30} />
          <Tooltip
            contentStyle={{ background: "#000000", border: "2px solid #ffffff", fontFamily: "var(--font-vt323)" }}
            labelStyle={{ color: "#9a9a9a" }}
            itemStyle={{ color: "#8b5cf6" }}
          />
          <Area type="monotone" dataKey="plays" stroke="#8b5cf6" strokeWidth={2} fill="url(#playsFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
