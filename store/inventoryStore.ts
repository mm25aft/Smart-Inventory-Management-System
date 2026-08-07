"use client";

import { create } from "zustand";

import type { InventoryFilters, InventoryItem, PredictionResult } from "@/types";

interface InventoryStoreState {
  filters: InventoryFilters;
  items: InventoryItem[];
  predictions: PredictionResult[];
  setFilters: (filters: Partial<InventoryFilters>) => void;
  setItems: (items: InventoryItem[]) => void;
  setPredictions: (predictions: PredictionResult[]) => void;
}

const defaultFilters: InventoryFilters = {
  search: "",
  categoryId: "",
  supplierId: "",
  stockStatus: "ALL",
  page: 1,
  pageSize: 10,
};

export const useInventoryStore = create<InventoryStoreState>((set) => ({
  filters: defaultFilters,
  items: [],
  predictions: [],
  setFilters: (filters) =>
    set((state) => ({
      filters: {
        ...state.filters,
        ...filters,
      },
    })),
  setItems: (items) => set({ items }),
  setPredictions: (predictions) => set({ predictions }),
}));
