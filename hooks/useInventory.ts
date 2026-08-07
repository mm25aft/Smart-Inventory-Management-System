"use client";

import { useEffect, useState } from "react";

import { listInventoryItems } from "@/lib/firestore";
import { useInventoryStore } from "@/store/inventoryStore";
import type { PaginatedResult, InventoryItem } from "@/types";

export function useInventory() {
  const { filters, setItems } = useInventoryStore();
  const [data, setData] = useState<PaginatedResult<InventoryItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await listInventoryItems(filters);
        setData(response);
        setItems(response.items);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Failed to load inventory.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [filters, setItems]);

  return {
    data,
    loading,
    error,
    filters,
  };
}
