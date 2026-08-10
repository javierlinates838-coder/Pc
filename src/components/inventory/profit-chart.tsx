"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface ChartPoint {
  name: string;
  invested: number;
  profit: number;
  sale: number;
}

export function ProfitChart({ data }: { data: ChartPoint[] }) {
  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
        <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            background: "#111827",
            border: "1px solid #1e293b",
            borderRadius: 8,
          }}
        />
        <Bar dataKey="invested" fill="#3b82f6" name="Invested" />
        <Bar dataKey="profit" fill="#22c55e" name="Profit" />
      </BarChart>
    </ResponsiveContainer>
  );
}
