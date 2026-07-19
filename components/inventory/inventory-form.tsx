"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useState } from "react";
import { type z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { inventorySchema, type InventoryValues } from "@/lib/validators";
import { saveCategory, saveInventoryItem, saveSupplier, uploadInventoryImage } from "@/lib/firestore";
import type { Category, InventoryItem, Supplier } from "@/types";

interface InventoryFormProps {
  categories: Category[];
  suppliers: Supplier[];
  currentUserId: string;
  item?: InventoryItem;
  onCatalogUpdate: (catalog: { categories?: Category[]; suppliers?: Supplier[] }) => void;
  onSuccess: () => void;
}

export function InventoryForm({
  categories,
  suppliers,
  currentUserId,
  item,
  onCatalogUpdate,
  onSuccess,
}: InventoryFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [showCategoryCreate, setShowCategoryCreate] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [categoryCreateError, setCategoryCreateError] = useState<string | null>(null);

  const form = useForm<z.input<typeof inventorySchema>, unknown, InventoryValues>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      name: item?.name ?? "",
      sku: item?.sku ?? "",
      categoryId: item?.categoryId ?? "",
      supplierName: suppliers.find((supplier) => supplier.id === item?.supplierId)?.name ?? "",
      unit: item?.unit ?? "pcs",
      currentStock: item?.currentStock ?? 0,
      minStockLevel: item?.minStockLevel ?? 0,
      maxStockLevel: item?.maxStockLevel ?? 0,
      costPrice: item?.costPrice ?? 0,
      sellingPrice: item?.sellingPrice ?? 0,
      location: item?.location ?? "",
      imageUrl: item?.imageUrl ?? "",
    },
  });
  const imageUrl = useWatch({
    control: form.control,
    name: "imageUrl",
  });

  const createCategory = async () => {
    try {
      setCategoryCreateError(null);

      const trimmedName = newCategoryName.trim();
      const trimmedDescription = newCategoryDescription.trim();

      if (!trimmedName || !trimmedDescription) {
        throw new Error("Enter both category name and description.");
      }

      const existingCategory = categories.find(
        (category) => category.name.trim().toLowerCase() === trimmedName.toLowerCase(),
      );

      const categoryId =
        existingCategory?.id ??
        (await saveCategory(
          {
            name: trimmedName,
            description: trimmedDescription,
          },
          currentUserId,
        ));

      const nextCategories = existingCategory
        ? categories
        : [
            ...categories,
            {
              id: categoryId,
              name: trimmedName,
              description: trimmedDescription,
              createdAt: new Date().toISOString(),
            },
          ].sort((left, right) => left.name.localeCompare(right.name));

      onCatalogUpdate({ categories: nextCategories });
      form.setValue("categoryId", categoryId, { shouldDirty: true, shouldValidate: true });
      setNewCategoryName("");
      setNewCategoryDescription("");
      setShowCategoryCreate(false);
    } catch (caughtError) {
      setCategoryCreateError(
        caughtError instanceof Error ? caughtError.message : "Unable to create category.",
      );
    }
  };

  const handleFileUpload = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) {
      return;
    }

    const imageUrl = await uploadInventoryImage(file);
    form.setValue("imageUrl", imageUrl, { shouldDirty: true });
  };

  const submit = form.handleSubmit(async (values) => {
    try {
      setFormError(null);
      const trimmedSupplierName = values.supplierName.trim();
      const matchedSupplier = suppliers.find(
        (supplier) => supplier.name.trim().toLowerCase() === trimmedSupplierName.toLowerCase(),
      );

      const supplierId =
        matchedSupplier?.id ??
        (await saveSupplier(
          {
            name: trimmedSupplierName,
            contactEmail: "",
            phone: "",
            address: "",
          },
          currentUserId,
        ));

      if (!matchedSupplier) {
        const nextSuppliers = [
          ...suppliers,
          {
            id: supplierId,
            name: trimmedSupplierName,
            contactEmail: "",
            phone: "",
            address: "",
            createdAt: new Date().toISOString(),
          },
        ].sort((left, right) => left.name.localeCompare(right.name));
        onCatalogUpdate({ suppliers: nextSuppliers });
      }

      await saveInventoryItem(
        {
          ...values,
          supplierId,
          createdBy: item?.createdBy ?? currentUserId,
        },
        currentUserId,
        item?.id,
      );
      onSuccess();
    } catch (caughtError) {
      setFormError(caughtError instanceof Error ? caughtError.message : "Unable to save inventory item.");
    }
  });

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-[0.02em] text-muted">Item name</span>
          <Input error={form.formState.errors.name?.message} {...form.register("name")} />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-[0.02em] text-muted">SKU</span>
          <Input error={form.formState.errors.sku?.message} {...form.register("sku")} />
        </label>
        <label className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium uppercase tracking-[0.02em] text-muted">Category</span>
            <button
              type="button"
              className="text-xs font-medium text-accent transition duration-80 ease-out hover:text-accent-hover"
              onClick={() => setShowCategoryCreate((current) => !current)}
            >
              {showCategoryCreate ? "Cancel" : "Create category"}
            </button>
          </div>
          <Select error={form.formState.errors.categoryId?.message} {...form.register("categoryId")}>
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-[0.02em] text-muted">Supplier</span>
          <Input
            placeholder="Type supplier name"
            error={form.formState.errors.supplierName?.message}
            {...form.register("supplierName")}
          />
          <p className="text-xs text-muted">
            Existing suppliers are matched automatically. A new supplier will be created if needed.
          </p>
        </label>
        {showCategoryCreate ? (
          <div className="space-y-3 rounded-lg border border-line bg-subtle p-4 md:col-span-2">
            <div>
              <p className="text-sm font-medium text-primary">Create category</p>
              <p className="text-xs text-muted">Add a category here and it will be selected automatically.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                placeholder="Category name"
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
              />
              <Textarea
                className="md:col-span-1"
                placeholder="Category description"
                value={newCategoryDescription}
                onChange={(event) => setNewCategoryDescription(event.target.value)}
              />
            </div>
            {categoryCreateError ? (
              <p className="rounded-md border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
                {categoryCreateError}
              </p>
            ) : null}
            <div className="flex justify-end">
              <Button type="button" variant="secondary" onClick={() => void createCategory()}>
                Save Category
              </Button>
            </div>
          </div>
        ) : null}
        <label className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-[0.02em] text-muted">Unit</span>
          <Input error={form.formState.errors.unit?.message} {...form.register("unit")} />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-[0.02em] text-muted">Location</span>
          <Input error={form.formState.errors.location?.message} {...form.register("location")} />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-[0.02em] text-muted">Current stock</span>
          <Input type="number" error={form.formState.errors.currentStock?.message} {...form.register("currentStock")} />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-[0.02em] text-muted">Min stock</span>
          <Input type="number" error={form.formState.errors.minStockLevel?.message} {...form.register("minStockLevel")} />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-[0.02em] text-muted">Max stock</span>
          <Input type="number" error={form.formState.errors.maxStockLevel?.message} {...form.register("maxStockLevel")} />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-[0.02em] text-muted">Cost price</span>
          <Input type="number" step="0.01" error={form.formState.errors.costPrice?.message} {...form.register("costPrice")} />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-[0.02em] text-muted">Selling price</span>
          <Input type="number" step="0.01" error={form.formState.errors.sellingPrice?.message} {...form.register("sellingPrice")} />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-[0.02em] text-muted">Image</span>
          <Input type="file" accept="image/*" onChange={(event) => void handleFileUpload(event.target.files)} />
        </label>
      </div>

      {imageUrl ? (
        <div className="rounded-md border border-line bg-subtle p-3 text-xs text-secondary">
          Uploaded image URL saved.
        </div>
      ) : null}

      {formError ? <p className="rounded-md border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">{formError}</p> : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving..." : item ? "Update Item" : "Create Item"}
        </Button>
      </div>
    </form>
  );
}
