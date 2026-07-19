import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  trend?: string;
  trendDirection?: "up" | "down";
  icon: LucideIcon;
}

export function StatCard({ label, value, trend, trendDirection = "up", icon: Icon }: StatCardProps) {
  const TrendIcon = trendDirection === "up" ? ArrowUpRight : ArrowDownRight;
  void Icon;

  return (
    <div className="rounded-lg border border-line bg-elevated px-6 py-5 shadow-sm dark:shadow-none">
      <p className="text-xs font-medium uppercase tracking-[0.02em] text-muted">{label}</p>
      <p className="mt-3 font-mono text-2xl font-semibold text-primary">{value}</p>
      {trend ? (
        <div
          className={cn(
            "mt-3 inline-flex items-center gap-1 text-xs font-medium",
            trendDirection === "up" ? "text-success" : "text-danger",
          )}
        >
          <TrendIcon className="h-3.5 w-3.5" />
          {trend}
        </div>
      ) : null}
    </div>
  );
}
