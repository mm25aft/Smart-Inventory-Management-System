import { cn, getStockStatus } from "@/lib/utils";
import type { InventoryItem } from "@/types";

const styles = {
  OK: "border-success/20 bg-success/10 text-success",
  LOW: "border-warning/20 bg-warning/10 text-warning",
  OUT: "border-danger/20 bg-danger/10 text-danger",
};

export function StockBadge({
  item,
}: {
  item: Pick<InventoryItem, "currentStock" | "minStockLevel">;
}) {
  const status = getStockStatus(item);

  return (
    <span className={cn("inline-flex h-5 items-center rounded-md border px-2 text-xs font-medium", styles[status])}>
      {status === "OK" ? "In Stock" : status === "LOW" ? "Low Stock" : "Out Of Stock"}
    </span>
  );
}
