"use client";

import { create } from "zustand";

import type { AppUser } from "@/types";

interface AuthStoreState {
  user: AppUser | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  setUser: (user: AppUser | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  loading: true,
  initialized: false,
  error: null,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),
  setError: (error) => set({ error }),
}));
