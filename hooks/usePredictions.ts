"use client";

import { useCallback, useState } from "react";

import { useInventoryStore } from "@/store/inventoryStore";
import type { PredictionResult } from "@/types";

export function usePredictions() {
  const { predictions, setPredictions } = useInventoryStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePredictions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/predictions", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to generate predictions.");
      }

      const data = (await response.json()) as { predictions: PredictionResult[] };
      setPredictions(data.predictions);
      return data.predictions;
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Failed to generate predictions.";
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [setPredictions]);

  return {
    predictions,
    loading,
    error,
    generatePredictions,
  };
}
