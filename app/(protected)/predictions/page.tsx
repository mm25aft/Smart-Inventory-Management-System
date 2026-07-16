"use client";

import { Download } from "lucide-react";
import { useEffect, useState } from "react";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { PredictionCard } from "@/components/ui/prediction-card";
import { usePredictions } from "@/hooks/usePredictions";
import { listInventoryItems } from "@/lib/firestore";
import type { InventoryItem } from "@/types";

export default function PredictionsPage() {
  const { predictions, loading, generatePredictions } = usePredictions();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  useEffect(() => {
    let active = true;

    void listInventoryItems({ page: 1, pageSize: 500 }).then((response) => {
      if (active) {
        setInventory(response.items);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const downloadCriticalReport = async () => {
    const response = await fetch("/api/export/reorder", { method: "POST" });
    const payload = (await response.json()) as { content: string; fileName: string };
    const blob = new Blob([payload.content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = payload.fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <Header
        title="Predictions"
        description="AI-assisted demand forecasting for 7, 14, and 30 day reorder planning."
      />

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => void generatePredictions()} disabled={loading}>
          {loading ? "Generating..." : "Refresh Predictions"}
        </Button>
        <Button variant="secondary" onClick={() => void downloadCriticalReport()}>
          <Download className="mr-2 h-4 w-4" />
          Reorder All Critical
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {predictions.map((prediction) => {
          const item = inventory.find((inventoryItem) => inventoryItem.id === prediction.itemId);
          return (
            <PredictionCard
              key={prediction.itemId}
              prediction={prediction}
              itemName={item?.name ?? prediction.itemId}
            />
          );
        })}
        {!loading && predictions.length === 0 ? (
          <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-line bg-elevated p-5 text-center text-secondary">
            No predictions available yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}
