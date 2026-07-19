"use client";

import { useAuth } from "@/hooks/useAuth";

export function AppProvider({ children }: { children: React.ReactNode }) {
  useAuth();
  return children;
}
