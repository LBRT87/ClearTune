"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export function RevenueSplitChart({ subscription, treasury }: { subscription: number; treasury: number }) {
  const data = [
    { name: "Dari subscription", value: subscription, color: "#8b5cf6" },
    { name: "Dari treasury (gratis)", value: treasury, color: "#4ade80" },
  ];

  if (subscription + treasury === 0) {
    return <p className="text-dim text-lg py-8">Belum ada data play.</p>;
  }

  return (
    <div style={{ width: "100%", height: 220 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3} stroke="#000000" strokeWidth={2}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: "#000000", border: "2px solid #ffffff", fontFamily: "var(--font-vt323)" }}
            labelStyle={{ color: "#9a9a9a" }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-6 mt-2 text-lg">
        <span className="text-purple">■ subscription</span>
        <span className="text-green">■ treasury</span>
      </div>
    </div>
  );
}
