"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCompactNumber, formatNumber } from "@/lib/utils";
import type { CategoryStockDatum } from "@/types";

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

export function StockByCategoryChart({ data }: { data: CategoryStockDatum[] }) {
  return (
    <div className="px-1 py-2">
      <div className="mb-4">
        <h3 className="font-display text-lg font-medium text-primary">Stock By Category</h3>
        <p className="mt-1 text-sm text-secondary">Total on-hand quantity grouped by category.</p>
      </div>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="var(--border)" />
            <XAxis
              dataKey="categoryName"
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => formatCompactNumber(toNumber(value))}
            />
          <Tooltip
              contentStyle={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                boxShadow: "0 4px 16px rgba(0,0,0,0.24)",
              }}
              formatter={(value) => [formatNumber(toNumber(value)), "Stock"]}
            />
            <Bar dataKey="stock" fill="var(--accent)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
