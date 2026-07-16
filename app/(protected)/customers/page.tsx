"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, RefreshCcw, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CustomerOrderRecord } from "@/types";

type SortColumn =
  | "customerName"
  | "customerContactNumber"
  | "orderIdentifier"
  | "orderedProductDetails";
type SortDirection = "asc" | "desc";

const columns: Array<{ key: SortColumn; label: string }> = [
  { key: "customerName", label: "Customer name" },
  { key: "customerContactNumber", label: "Customer contact number" },
  { key: "orderIdentifier", label: "Order identifier" },
  { key: "orderedProductDetails", label: "Ordered product details" },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<SortColumn, string>>({
    customerName: "",
    customerContactNumber: "",
    orderIdentifier: "",
    orderedProductDetails: "",
  });
  const [sort, setSort] = useState<{ column: SortColumn; direction: SortDirection }>({
    column: "customerName",
    direction: "asc",
  });

  const fetchCustomers = useCallback(async () => {
    const response = await fetch("/api/customers", {
      cache: "no-store",
    });
    const payload = (await response.json()) as { customers?: CustomerOrderRecord[]; error?: string };

    if (!response.ok) {
      throw new Error(payload.error ?? "Unable to load CRM customer data.");
    }

    return payload.customers ?? [];
  }, []);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setCustomers(await fetchCustomers());
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load CRM customer data.");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [fetchCustomers]);

  useEffect(() => {
    let active = true;

    void fetchCustomers()
      .then((records) => {
        if (!active) {
          return;
        }

        setCustomers(records);
        setError(null);
      })
      .catch((caughtError: unknown) => {
        if (!active) {
          return;
        }

        setError(caughtError instanceof Error ? caughtError.message : "Unable to load CRM customer data.");
        setCustomers([]);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [fetchCustomers]);

  const filteredCustomers = useMemo(() => {
    const normalizedFilters = Object.fromEntries(
      Object.entries(filters).map(([key, value]) => [key, value.trim().toLowerCase()]),
    ) as Record<SortColumn, string>;

    const next = customers.filter((customer) =>
      columns.every(({ key }) =>
        normalizedFilters[key] ? customer[key].toLowerCase().includes(normalizedFilters[key]) : true,
      ),
    );

    return next.sort((left, right) => {
      const leftValue = left[sort.column].toLowerCase();
      const rightValue = right[sort.column].toLowerCase();

      if (leftValue === rightValue) {
        return 0;
      }

      const result = leftValue > rightValue ? 1 : -1;
      return sort.direction === "asc" ? result : -result;
    });
  }, [customers, filters, sort]);

  const toggleSort = (column: SortColumn) => {
    setSort((current) =>
      current.column === column
        ? {
            column,
            direction: current.direction === "asc" ? "desc" : "asc",
          }
        : {
            column,
            direction: "asc",
          },
    );
  };

  const getSortIcon = (column: SortColumn) => {
    if (sort.column !== column) {
      return <ArrowUpDown className="h-4 w-4 stroke-[1.5]" />;
    }

    return sort.direction === "asc" ? (
      <ArrowUp className="h-4 w-4 stroke-[1.5]" />
    ) : (
      <ArrowDown className="h-4 w-4 stroke-[1.5]" />
    );
  };

  return (
    <div className="space-y-8">
      <Header
        title="Customers"
        description="Structured CRM customer and order data synced from Airtable."
      />

      <section className="rounded-lg border border-line bg-elevated p-5 shadow-sm dark:shadow-none">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">CRM Table</p>
            <h3 className="mt-2 font-display text-lg font-medium text-primary">Customer Orders</h3>
            <p className="mt-1 text-sm text-secondary">
              Sort and filter each core column to review current Airtable CRM records quickly.
            </p>
          </div>
          <Button variant="secondary" onClick={() => void loadCustomers()} disabled={loading}>
            <RefreshCcw className="h-4 w-4" />
            {loading ? "Refreshing..." : "Refresh Data"}
          </Button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {columns.map((column) => (
            <label key={column.key} className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-[0.02em] text-muted">
                Filter {column.label}
              </span>
              <Input
                value={filters[column.key]}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    [column.key]: event.target.value,
                  }))
                }
                placeholder={`Filter ${column.label.toLowerCase()}`}
              />
            </label>
          ))}
        </div>
      </section>

      {error ? (
        <div className="rounded-lg border border-danger/20 bg-danger/10 p-5 text-sm text-danger">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-lg border border-line bg-elevated p-5 shadow-sm dark:shadow-none">
          <div className="space-y-3">
            <div className="h-10 rounded-md bg-subtle" />
            <div className="h-12 rounded-md bg-subtle" />
            <div className="h-12 rounded-md bg-subtle" />
            <div className="h-12 rounded-md bg-subtle" />
          </div>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-lg border border-line bg-elevated p-5 text-center">
          <Users className="h-10 w-10 text-muted stroke-[1.5]" />
          <div className="space-y-1">
            <p className="text-base font-medium text-secondary">No customer records found</p>
            <p className="max-w-xs text-sm text-muted">
              Check the Airtable base configuration or loosen the current column filters.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto border-t border-line md:block">
            <table className="min-w-full">
              <thead>
                <tr className="h-10 border-b border-line bg-subtle">
                  {columns.map((column) => (
                    <th key={column.key} className="px-4 text-left">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted transition duration-80 ease-out hover:text-primary"
                        onClick={() => toggleSort(column.key)}
                      >
                        <span>{column.label}</span>
                        {getSortIcon(column.key)}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-line transition duration-80 ease-out hover:bg-subtle"
                  >
                    <td className="px-4 py-3 text-sm text-primary">{customer.customerName}</td>
                    <td className="px-4 py-3 font-mono text-sm text-primary">
                      {customer.customerContactNumber}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-primary">{customer.orderIdentifier}</td>
                    <td className="px-4 py-3 text-sm text-primary">{customer.orderedProductDetails}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="rounded-lg border border-line bg-elevated p-4 shadow-sm dark:shadow-none"
              >
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
                      Customer name
                    </p>
                    <p className="mt-1 text-sm font-medium text-primary">{customer.customerName}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
                      Customer contact number
                    </p>
                    <p className="mt-1 font-mono text-sm text-primary">{customer.customerContactNumber}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
                      Order identifier
                    </p>
                    <p className="mt-1 font-mono text-sm text-primary">{customer.orderIdentifier}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
                      Ordered product details
                    </p>
                    <p className="mt-1 text-sm text-primary">{customer.orderedProductDetails}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
