"use client";

import Image from "next/image";
import Link from "next/link";
import { Download, Minus, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { InventoryForm } from "@/components/inventory/inventory-form";
import { StockAdjustmentForm } from "@/components/inventory/stock-adjustment-form";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { StockBadge } from "@/components/ui/stock-badge";
import { useInventory } from "@/hooks/useInventory";
import { deleteInventoryItem, listCategories, listSuppliers } from "@/lib/firestore";
import { formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useInventoryStore } from "@/store/inventoryStore";
import type { Category, InventoryItem, StockMovementType, Supplier } from "@/types";

export default function InventoryPage() {
  const user = useAuthStore((state) => state.user);
  const { data, loading } = useInventory();
  const { filters, setFilters } = useInventoryStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | undefined>(undefined);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockItem, setStockItem] = useState<InventoryItem | undefined>(undefined);
  const [stockActionType, setStockActionType] = useState<StockMovementType>("IN");

  useEffect(() => {
    const loadStaticData = async () => {
      const [nextCategories, nextSuppliers] = await Promise.all([listCategories(), listSuppliers()]);
      setCategories(nextCategories);
      setSuppliers(nextSuppliers);
    };

    void loadStaticData();
  }, []);

  const categoryLookup = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.id, category.name])),
    [categories],
  );
  const supplierLookup = useMemo(
    () => Object.fromEntries(suppliers.map((supplier) => [supplier.id, supplier.name])),
    [suppliers],
  );

  const exportCsv = async () => {
    const response = await fetch("/api/export/inventory", { method: "POST" });
    const payload = (await response.json()) as { content: string; fileName: string };
    const blob = new Blob([payload.content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = payload.fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (item: InventoryItem) => {
    if (user?.role !== "ADMIN") {
      return;
    }

    if (!window.confirm(`Delete ${item.name}? This action cannot be undone.`)) {
      return;
    }

    await deleteInventoryItem(item.id, user.id);
    setFilters({ page: 1 });
  };

  const openStockModal = (item: InventoryItem, type: "IN" | "OUT") => {
    setStockItem(item);
    setStockActionType(type);
    setStockModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <Header
        title="Inventory"
        description="Search, filter, export, and manage the full inventory catalog."
      />

      <div className="flex flex-col gap-4 rounded-lg border border-line bg-elevated p-5 shadow-sm dark:shadow-none md:flex-row md:items-center md:justify-between">
        <div className="grid gap-3 md:grid-cols-4">
          <Input
            placeholder="Search items, SKU, location"
            value={filters.search}
            onChange={(event) => setFilters({ search: event.target.value, page: 1 })}
          />
          <Select value={filters.categoryId} onChange={(event) => setFilters({ categoryId: event.target.value, page: 1 })}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          <Select value={filters.supplierId} onChange={(event) => setFilters({ supplierId: event.target.value, page: 1 })}>
            <option value="">All suppliers</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </Select>
          <Select value={filters.stockStatus} onChange={(event) => setFilters({ stockStatus: event.target.value as "ALL" | "OK" | "LOW" | "OUT", page: 1 })}>
            <option value="ALL">All status</option>
            <option value="OK">OK</option>
            <option value="LOW">Low</option>
            <option value="OUT">Out</option>
          </Select>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => void exportCsv()}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          {(user?.role === "ADMIN" || user?.role === "MANAGER") && (
            <Button
              onClick={() => {
                setSelectedItem(undefined);
                setModalOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          )}
        </div>
      </div>

      <DataTable
        data={data?.items ?? []}
        columns={[
          {
            key: "image",
            header: "Image",
            render: (item) => (
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border border-line bg-subtle">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    width={48}
                    height={48}
                    className="h-12 w-12 object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-[11px] text-muted">None</span>
                )}
              </div>
            ),
          },
          {
            key: "name",
            header: "Item",
            render: (item) => (
              <div>
                <Link href={`/inventory/${item.id}`} className="font-medium text-primary transition duration-80 ease-out hover:text-accent">
                  {item.name}
                </Link>
                <p className="font-mono text-xs text-muted">{item.sku}</p>
              </div>
            ),
          },
          {
            key: "category",
            header: "Category",
            render: (item) => categoryLookup[item.categoryId] ?? "Unknown",
          },
          {
            key: "supplier",
            header: "Supplier",
            render: (item) => supplierLookup[item.supplierId] ?? "Unknown",
          },
          {
            key: "stock",
            header: "Stock",
            render: (item) => (
              <div className="space-y-1">
                <p className="font-mono text-sm text-primary">
                  {item.currentStock} {item.unit}
                </p>
                <StockBadge item={item} />
              </div>
            ),
          },
          {
            key: "value",
            header: "Value",
            render: (item) => formatCurrency(item.currentStock * item.costPrice),
          },
          {
            key: "actions",
            header: "Actions",
            render: (item) => (
              <div className="flex flex-wrap justify-end gap-1 opacity-0 transition duration-80 ease-out group-hover:opacity-100">
                {(user?.role === "ADMIN" || user?.role === "MANAGER") && (
                  <>
                    <Button variant="ghost" className="h-8 w-8 px-0" onClick={() => openStockModal(item, "IN")}>
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" className="h-8 w-8 px-0" onClick={() => openStockModal(item, "OUT")}>
                      <Minus className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {(user?.role === "ADMIN" || user?.role === "MANAGER") && (
                  <Button
                    variant="ghost"
                    className="h-8 w-8 px-0"
                    onClick={() => {
                      setSelectedItem(item);
                      setModalOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {user?.role === "ADMIN" && (
                  <Button variant="danger" className="h-8 w-8 px-0" onClick={() => void handleDelete(item)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ),
          },
        ]}
        emptyMessage={loading ? "Loading inventory..." : "No inventory items found."}
        page={data?.page ?? 1}
        totalPages={data?.totalPages ?? 1}
        onPageChange={(page) => setFilters({ page })}
      />

      {user && (user.role === "ADMIN" || user.role === "MANAGER") ? (
        <Modal
          open={modalOpen}
          onOpenChange={setModalOpen}
          title={selectedItem ? "Edit Inventory Item" : "Add Inventory Item"}
          description="All inventory writes are validated and audited."
        >
          <InventoryForm
            categories={categories}
            suppliers={suppliers}
            currentUserId={user.id}
            item={selectedItem}
            onCatalogUpdate={({ categories: nextCategories, suppliers: nextSuppliers }) => {
              if (nextCategories) {
                setCategories(nextCategories);
              }

              if (nextSuppliers) {
                setSuppliers(nextSuppliers);
              }
            }}
            onSuccess={() => {
              setModalOpen(false);
              setSelectedItem(undefined);
              setFilters({ page: 1 });
            }}
          />
        </Modal>
      ) : null}

      {user && stockItem && (user.role === "ADMIN" || user.role === "MANAGER") ? (
        <Modal
          open={stockModalOpen}
          onOpenChange={setStockModalOpen}
          title={`${stockActionType === "IN" ? "Increase" : "Decrease"} Stock`}
          description={`Quick stock update for ${stockItem.name}.`}
        >
          <StockAdjustmentForm
            inventoryId={stockItem.id}
            performedBy={user.id}
            defaultType={stockActionType}
            hideTypeSelect
            title={`${stockActionType === "IN" ? "Add stock" : "Remove stock"}`}
            description={`Current stock: ${stockItem.currentStock} ${stockItem.unit}`}
            submitLabel={stockActionType === "IN" ? "Add Stock" : "Remove Stock"}
            onSuccess={() => {
              setStockModalOpen(false);
              setStockItem(undefined);
              setFilters({ page: data?.page ?? 1 });
            }}
          />
        </Modal>
      ) : null}
    </div>
  );
}
