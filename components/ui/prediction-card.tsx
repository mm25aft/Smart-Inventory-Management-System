import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";
import type { PredictionResult } from "@/types";

const urgencyStyles = {
  critical: {
    badgeClassName: "border-danger/20 bg-danger/10 text-danger",
    barClassName: "bg-danger",
    icon: AlertTriangle,
    label: "Critical",
  },
  soon: {
    badgeClassName: "border-warning/20 bg-warning/10 text-warning",
    barClassName: "bg-warning",
    icon: Clock3,
    label: "Soon",
  },
  ok: {
    badgeClassName: "border-success/20 bg-success/10 text-success",
    barClassName: "bg-success",
    icon: CheckCircle2,
    label: "OK",
  },
};

export function PredictionCard({
  prediction,
  itemName,
  onReorder,
}: {
  prediction: PredictionResult;
  itemName: string;
  onReorder?: () => void;
}) {
  const urgency = urgencyStyles[prediction.urgency];
  const Icon = urgency.icon;

  return (
    <div className="relative overflow-hidden rounded-lg border border-line bg-elevated p-5 shadow-sm dark:shadow-none">
      <div className={`absolute inset-y-0 right-0 w-[3px] ${urgency.barClassName}`} />
      <div className="flex items-start justify-between gap-4 pr-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-medium text-primary">{itemName}</h3>
          <p className="mt-1 font-mono text-xs text-muted">{prediction.itemId}</p>
        </div>
        <span
          className={`inline-flex h-5 items-center gap-1 rounded-md border px-2 text-xs font-medium ${urgency.badgeClassName}`}
        >
          <Icon className="h-3.5 w-3.5" />
          {urgency.label}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="7d" value={prediction.predictedDemand7d} />
        <Metric label="14d" value={prediction.predictedDemand14d} />
        <Metric label="30d" value={prediction.predictedDemand30d} />
        <Metric label="Reorder" value={prediction.recommendedReorderQty} />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 pr-4">
        <div className="min-w-0">
          <p className="text-xs text-secondary">{prediction.reasoning}</p>
          <p className="mt-2 font-mono text-xs text-muted">
            Safety {formatNumber(prediction.safetyStock)} | Daily {formatNumber(prediction.averageDailyConsumption)}
          </p>
        </div>
        {onReorder ? (
          <Button variant={prediction.urgency === "critical" ? "danger" : "secondary"} onClick={onReorder}>
            Reorder
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-line bg-base px-3 py-3 dark:bg-subtle">
      <p className="text-xs uppercase tracking-[0.02em] text-muted">{label}</p>
      <p className="mt-2 font-mono text-xl font-semibold text-primary">{formatNumber(value)}</p>
    </div>
  );
}
