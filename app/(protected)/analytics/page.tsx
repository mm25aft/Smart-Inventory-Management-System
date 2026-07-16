"use client";

import { useEffect, useState } from "react";

import { Header } from "@/components/layout/header";
import { StockValueAreaChart, TopMovedItemsChart } from "@/components/charts/analytics-charts";
import { getAnalyticsData } from "@/lib/firestore";
import { formatCompactCurrency, formatDateTime, formatNumber } from "@/lib/utils";
import type { AnalyticsSnapshot } from "@/types";

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void getAnalyticsData()
      .then((result) => {
        if (!active) {
          return;
        }

        setAnalytics(result);
        setError(null);
      })
      .catch((caughtError: unknown) => {
        if (!active) {
          return;
        }

        setError(
          caughtError instanceof Error ? caughtError.message : "Unable to load analytics data.",
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <Header
          title="Analytics"
          description="Track valuation trends, movement leaders, dead stock, and supplier performance."
        />
        <div className="rounded-lg border border-line bg-elevated p-5 text-sm text-secondary shadow-sm dark:shadow-none">
          Loading analytics...
        </div>
      </div>
    );
  }

  if (analytics) {
    const deadStockCount = analytics.deadStockItems.length;
    const averageDeliveryQty =
      analytics.supplierPerformance.length > 0
        ? analytics.supplierPerformance.reduce((sum, supplier) => sum + supplier.averageDeliveryQty, 0) /
          analytics.supplierPerformance.length
        : 0;
    const mostMovedItem = analytics.topMovedItems[0];
    const latestStockValue = analytics.stockValueOverTime.at(-1)?.value ?? 0;

    return (
      <div className="space-y-8">
        <Header
          title="Analytics"
          description="Track valuation trends, movement leaders, dead stock, and supplier performance."
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InsightCard
            label="Current Stock Value"
            value={formatCompactCurrency(latestStockValue)}
            description="Latest valuation snapshot across the full inventory portfolio."
          />
          <InsightCard
            label="Dead Stock Items"
            value={formatNumber(deadStockCount)}
            description="Items with no movement during the last 60 days."
          />
          <InsightCard
            label="Top Moved Item"
            value={mostMovedItem?.itemName ?? "No data"}
            description={
              mostMovedItem
                ? `${formatNumber(mostMovedItem.movementCount)} movements recorded.`
                : "Movement data is not available yet."
            }
          />
          <InsightCard
            label="Avg Supplier Delivery"
            value={formatNumber(averageDeliveryQty)}
            description="Average inbound quantity per supplier delivery."
          />
        </section>

        <section className="space-y-6">
          <StockValueAreaChart data={analytics.stockValueOverTime} />
          <TopMovedItemsChart data={analytics.topMovedItems} />
        </section>

        <section className="space-y-6">
          <StaticTable
            title="Dead Stock Report"
            emptyMessage="No dead stock items."
            headers={["Item", "SKU", "Current Stock", "Location"]}
            rows={analytics.deadStockItems.map((item) => [
              item.name,
              item.sku,
              `${formatNumber(item.currentStock)} ${item.unit}`,
              item.location,
            ])}
          />

          <StaticTable
            title="Supplier Performance"
            emptyMessage="No supplier performance data."
            headers={["Supplier", "Avg Delivery Qty", "Frequency", "Last Delivery"]}
            rows={analytics.supplierPerformance.map((supplier) => [
              supplier.supplierName,
              formatNumber(supplier.averageDeliveryQty),
              formatNumber(supplier.deliveryFrequency),
              supplier.lastMovementAt ? formatDateTime(supplier.lastMovementAt) : "No deliveries",
            ])}
          />
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Header
        title="Analytics"
        description="Track valuation trends, movement leaders, dead stock, and supplier performance."
      />
      <div className="rounded-lg border border-danger/20 bg-danger/10 p-5 text-sm text-danger">
        {error}
      </div>
    </div>
  );
}

function StaticTable({
  title,
  headers,
  rows,
  emptyMessage,
}: {
  title: string;
  headers: string[];
  rows: string[][];
  emptyMessage: string;
}) {
  return (
    <div className="border-t border-line">
      <div className="flex items-center justify-between py-4">
        <h3 className="font-display text-lg font-medium text-primary">{title}</h3>
      </div>
      <div className="max-h-[32rem] overflow-auto">
        <table className="min-w-full">
          <thead>
            <tr className="h-10 border-b border-line bg-subtle">
              {headers.map((header) => (
                <th
                  key={header}
                  className="px-4 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-muted"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-4 py-10 text-center text-sm text-secondary">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={`${title}-${index}`}
                  className="h-12 border-b border-line transition duration-80 ease-out hover:bg-subtle"
                >
                  {row.map((cell, cellIndex) => (
                    <td key={`${title}-${index}-${cellIndex}`} className="px-4 text-sm text-primary">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InsightCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-elevated p-5 shadow-sm dark:shadow-none">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">{label}</p>
      <p className="mt-3 font-display text-2xl font-semibold text-primary">{value}</p>
      <p className="mt-2 text-sm text-secondary">{description}</p>
    </div>
  );
}
