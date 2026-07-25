import { clsx, type ClassValue } from "clsx";
import { format, formatDistanceToNowStrict, parseISO } from "date-fns";
import { twMerge } from "tailwind-merge";

import type { InventoryItem, StockStatus, UserRole } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDate(value: string) {
  return format(parseISO(value), "MMM d, yyyy");
}

export function formatDateTime(value: string) {
  return format(parseISO(value), "MMM d, yyyy h:mm a");
}

export function formatRelativeTime(value: string) {
  return formatDistanceToNowStrict(parseISO(value), { addSuffix: true });
}

export function getStockStatus(item: Pick<InventoryItem, "currentStock" | "minStockLevel">): StockStatus {
  if (item.currentStock <= 0) {
    return "OUT";
  }

  if (item.currentStock <= item.minStockLevel) {
    return "LOW";
  }

  return "OK";
}

export function hasMinimumRole(role: UserRole | undefined, minimumRole: UserRole) {
  if (!role) {
    return false;
  }

  const order: UserRole[] = ["VIEWER", "MANAGER", "ADMIN"];
  return order.indexOf(role) >= order.indexOf(minimumRole);
}

export function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
