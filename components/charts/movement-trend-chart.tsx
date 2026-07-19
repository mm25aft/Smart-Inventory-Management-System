"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCompactNumber, formatNumber } from "@/lib/utils";
import type { MovementTrendDatum } from "@/types";

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

export function MovementTrendChart({ data }: { data: MovementTrendDatum[] }) {
  return (
    <div className="px-1 py-2">
      <div className="mb-4">
        <h3 className="font-display text-lg font-medium text-primary">Movement Trend</h3>
        <p className="mt-1 text-sm text-secondary">Inbound, outbound, and adjustment activity over time.</p>
      </div>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="var(--border)" />
            <XAxis
              dataKey="date"
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
            formatter={(value) => formatNumber(toNumber(value))}
          />
            <Legend wrapperStyle={{ color: "var(--text-secondary)", fontSize: "11px" }} />
            <Line type="monotone" dataKey="in" stroke="var(--success)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="out" stroke="var(--accent)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="adjustments" stroke="var(--text-muted)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
