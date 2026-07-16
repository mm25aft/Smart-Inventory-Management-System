"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { MovementTrendChart } from "@/components/charts/movement-trend-chart";
import { StockAdjustmentForm } from "@/components/inventory/stock-adjustment-form";
import { Header } from "@/components/layout/header";
import { DataTable } from "@/components/ui/data-table";
import { StockBadge } from "@/components/ui/stock-badge";
import { getInventoryItemDetail } from "@/lib/firestore";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import type { ItemDetailPayload } from "@/types";

export default function InventoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const [detail, setDetail] = useState<ItemDetailPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await getInventoryItemDetail(id);
    setDetail(response);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    let active = true;

    void getInventoryItemDetail(id).then((response) => {
      if (active) {
        setDetail(response);
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <div className="p-6 text-secondary">Loading item details...</div>;
  }

  if (!detail) {
    return <div className="p-6 text-secondary">Item not found.</div>;
  }

  return (
    <div className="space-y-8">
      <Header title={detail.item.name} description={`SKU ${detail.item.sku} | ${detail.category?.name ?? "Unknown category"}`} />

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-line bg-elevated p-5 shadow-sm dark:shadow-none">
          <div className="grid gap-6 md:grid-cols-[220px_1fr]">
            <div className="overflow-hidden rounded-lg border border-line bg-subtle">
              {detail.item.imageUrl ? (
                <Image
                  src={detail.item.imageUrl}
                  alt={detail.item.name}
                  width={220}
                  height={220}
                  className="h-[220px] w-full object-cover"
                />
              ) : (
                <div className="flex h-[220px] items-center justify-center text-sm text-muted">
                  No image uploaded
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Info label="Supplier" value={detail.supplier?.name ?? "Unknown"} />
              <Info label="Location" value={detail.item.location} />
              <Info label="Current Stock" value={`${detail.item.currentStock} ${detail.item.unit}`} />
              <Info label="Stock Value" value={formatCurrency(detail.item.currentStock * detail.item.costPrice)} />
              <Info label="Cost Price" value={formatCurrency(detail.item.costPrice)} />
              <Info label="Selling Price" value={formatCurrency(detail.item.sellingPrice)} />
              <div className="md:col-span-2">
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.02em] text-muted">Status</p>
                <StockBadge item={detail.item} />
              </div>
            </div>
          </div>
        </div>

        {user && (user.role === "ADMIN" || user.role === "MANAGER") ? (
          <StockAdjustmentForm inventoryId={detail.item.id} performedBy={user.id} onSuccess={() => void load()} />
        ) : (
          <div className="rounded-lg border border-line bg-elevated p-5 text-sm text-secondary shadow-sm dark:shadow-none">
            Read-only access. Viewers cannot record stock movements.
          </div>
        )}
      </section>

      <MovementTrendChart data={detail.stockHistory} />

      <div className="grid gap-6 xl:grid-cols-2">
        <DataTable
          data={detail.movements}
          columns={[
            { key: "type", header: "Type", render: (movement) => movement.type },
            { key: "quantity", header: "Quantity", render: (movement) => movement.quantity },
            { key: "previous", header: "Previous", render: (movement) => movement.previousStock },
            { key: "new", header: "New", render: (movement) => movement.newStock },
            { key: "time", header: "Timestamp", render: (movement) => formatDateTime(movement.timestamp) },
          ]}
          emptyMessage="No stock movements recorded."
          page={1}
          totalPages={1}
          onPageChange={() => undefined}
        />

        <DataTable
          data={detail.auditLogs}
          columns={[
            { key: "action", header: "Action", render: (log) => log.action },
            { key: "performedBy", header: "Performed By", render: (log) => log.performedBy },
            { key: "timestamp", header: "Timestamp", render: (log) => formatDateTime(log.timestamp) },
            {
              key: "changes",
              header: "Changes",
              render: (log) => (
                <pre className="max-w-xs overflow-x-auto whitespace-pre-wrap text-xs text-muted">
                  {JSON.stringify(log.changes, null, 2)}
                </pre>
              ),
            },
          ]}
          emptyMessage="No audit logs found."
          page={1}
          totalPages={1}
          onPageChange={() => undefined}
        />
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-subtle p-4">
      <p className="text-xs uppercase tracking-[0.02em] text-muted">{label}</p>
      <p className="mt-2 text-sm font-medium text-primary">{value}</p>
    </div>
  );
}
