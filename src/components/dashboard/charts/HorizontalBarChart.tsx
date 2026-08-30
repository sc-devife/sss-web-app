"use client";

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface HorizontalBarDatum {
  label: string;
  value: number;
  color: string;
}

// Used by Lead Funnel, Escape Pipeline, and Top Escape Points — a plain
// horizontal bar with the count printed at the end of each bar, easy to
// scan even with a dozen-plus rows (Escape Pipeline has 11 stages).
export function HorizontalBarChart({
  data,
  valueFormatter,
  barHeight = 32,
}: {
  data: HorizontalBarDatum[];
  valueFormatter?: (value: number) => string;
  barHeight?: number;
}) {
  const format = valueFormatter ?? ((v: number) => String(v));
  const height = Math.max(data.length * barHeight, 120);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 32, bottom: 4, left: 4 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          width={130}
          tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value: unknown) => format(Number(value))}
          cursor={{ fill: "hsl(var(--muted))" }}
          contentStyle={{
            borderRadius: 8,
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--card))",
            color: "hsl(var(--card-foreground))",
            fontSize: 12,
          }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18}>
          {data.map((entry) => (
            <Cell key={entry.label} fill={entry.color} />
          ))}
          <LabelList dataKey="value" position="right" formatter={(value: unknown) => format(Number(value))} style={{ fontSize: 12, fill: "hsl(var(--foreground))" }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
