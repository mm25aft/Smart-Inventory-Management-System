"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCompactCurrency, formatCompactNumber, formatCurrency, formatNumber } from "@/lib/utils";

function toNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (Array.isArray(value)) {
    return toNumber(value[0]);
  }

  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function StockValueAreaChart({ data }: { data: Array<{ date: string; value: number }> }) {
  return (
    <div className="px-1 py-2">
      <div className="mb-5 flex flex-col gap-2">
        <h3 className="font-display text-lg font-medium text-primary">Stock Value Over Time</h3>
        <p className="text-sm text-secondary">
          Full trend view with compact currency labels so larger values stay readable.
        </p>
      </div>
      <div className="h-[28rem] md:h-[34rem]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 12, right: 18, left: 8, bottom: 12 }}>
            <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="var(--border)" />
          <XAxis
            dataKey="date"
              axisLine={false}
              tickLine={false}
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            minTickGap={32}
          />
          <YAxis
              axisLine={false}
              tickLine={false}
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            tickFormatter={(value) => formatCompactCurrency(toNumber(value))}
            width={92}
          />
          <Tooltip
            contentStyle={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              boxShadow: "0 4px 16px rgba(0,0,0,0.24)",
            }}
            formatter={(value) => [formatCurrency(toNumber(value)), "Stock Value"]}
            labelFormatter={(label) => `Date: ${String(label ?? "")}`}
          />
            <Area type="monotone" dataKey="value" stroke="var(--accent)" fill="color-mix(in srgb, var(--accent) 18%, transparent)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function TopMovedItemsChart({
  data,
}: {
  data: Array<{ itemId: string; itemName: string; movementCount: number }>;
}) {
  return (
    <div className="px-1 py-2">
      <div className="mb-5 flex flex-col gap-2">
        <h3 className="font-display text-lg font-medium text-primary">Top 10 Most Moved Items</h3>
        <p className="text-sm text-secondary">
          Larger horizontal bars make ranking and movement counts easier to compare.
        </p>
      </div>
      <div className="h-[30rem] md:h-[38rem]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 12, right: 18, left: 24, bottom: 12 }}>
            <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="var(--border)" />
          <XAxis
            type="number"
              axisLine={false}
              tickLine={false}
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            tickFormatter={(value) => formatCompactNumber(toNumber(value))}
          />
          <YAxis
            dataKey="itemName"
            type="category"
              axisLine={false}
              tickLine={false}
            tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
            width={180}
            interval={0}
          />
          <Tooltip
            contentStyle={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              boxShadow: "0 4px 16px rgba(0,0,0,0.24)",
            }}
            formatter={(value) => [formatNumber(toNumber(value)), "Movements"]}
          />
            <Bar dataKey="movementCount" fill="var(--accent)" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
