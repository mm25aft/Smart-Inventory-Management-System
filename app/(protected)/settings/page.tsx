"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Header } from "@/components/layout/header";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateCurrentPassword, updateCurrentProfile } from "@/lib/auth";
import {
  deleteCategory,
  deleteSupplier,
  listCategories,
  listSuppliers,
  saveCategory,
  saveSupplier,
  saveUserProfile,
} from "@/lib/firestore";
import {
  categorySchema,
  profileSchema,
  supplierSchema,
  type CategoryValues,
  type ProfileValues,
  type SupplierValues,
} from "@/lib/validators";
import { useAuthStore } from "@/store/authStore";
import type { Category, Supplier } from "@/types";

export default function SettingsPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const categoryForm = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", description: "" },
  });
  const supplierForm = useForm<SupplierValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { name: "", contactEmail: "", phone: "", address: "" },
  });
  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: {
      name: currentUser?.name ?? "",
      password: "",
    },
  });

  const load = useCallback(async () => {
    const [nextCategories, nextSuppliers] = await Promise.all([listCategories(), listSuppliers()]);
    setCategories(nextCategories);
    setSuppliers(nextSuppliers);
  }, []);

  useEffect(() => {
    let active = true;

    void Promise.all([listCategories(), listSuppliers()]).then(([nextCategories, nextSuppliers]) => {
      if (active) {
        setCategories(nextCategories);
        setSuppliers(nextSuppliers);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const submitCategory = categoryForm.handleSubmit(async (values) => {
    if (!currentUser) {
      return;
    }

    await saveCategory(values, currentUser.id);
    categoryForm.reset({ name: "", description: "" });
    await load();
  });

  const submitSupplier = supplierForm.handleSubmit(async (values) => {
    if (!currentUser) {
      return;
    }

    await saveSupplier(values, currentUser.id);
    supplierForm.reset({ name: "", contactEmail: "", phone: "", address: "" });
    await load();
  });

  const submitProfile = profileForm.handleSubmit(async (values) => {
    if (!currentUser) {
      return;
    }

    await updateCurrentProfile(values.name);
    if (values.password) {
      await updateCurrentPassword(values.password);
    }
    await saveUserProfile(currentUser.id, { name: values.name }, currentUser.id);
  });

  return (
    <div className="space-y-8">
      <Header title="Settings" description="Manage categories, suppliers, and your profile settings." />

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-line bg-elevated p-5 shadow-sm dark:shadow-none">
          <h3 className="mb-4 font-display text-lg font-medium text-primary">Categories</h3>
          <form className="space-y-4" onSubmit={submitCategory}>
            <Input placeholder="Category name" error={categoryForm.formState.errors.name?.message} {...categoryForm.register("name")} />
            <Textarea placeholder="Description" error={categoryForm.formState.errors.description?.message} {...categoryForm.register("description")} />
            <div className="flex justify-end">
              <Button type="submit">Add Category</Button>
            </div>
          </form>
        </div>

        <div className="rounded-lg border border-line bg-elevated p-5 shadow-sm dark:shadow-none">
          <h3 className="mb-4 font-display text-lg font-medium text-primary">Suppliers</h3>
          <form className="grid gap-4" onSubmit={submitSupplier}>
            <Input placeholder="Supplier name" error={supplierForm.formState.errors.name?.message} {...supplierForm.register("name")} />
            <Input placeholder="Contact email" error={supplierForm.formState.errors.contactEmail?.message} {...supplierForm.register("contactEmail")} />
            <Input placeholder="Phone" error={supplierForm.formState.errors.phone?.message} {...supplierForm.register("phone")} />
            <Textarea placeholder="Address" error={supplierForm.formState.errors.address?.message} {...supplierForm.register("address")} />
            <div className="flex justify-end">
              <Button type="submit">Add Supplier</Button>
            </div>
          </form>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <DataTable
          data={categories}
          columns={[
            { key: "name", header: "Name", render: (category) => category.name },
            { key: "description", header: "Description", render: (category) => category.description },
            {
              key: "action",
              header: "Action",
              render: (category) => (
                <Button variant="danger" onClick={() => currentUser && void deleteCategory(category.id, currentUser.id).then(load)}>
                  Delete
                </Button>
              ),
            },
          ]}
          emptyMessage="No categories found."
          page={1}
          totalPages={1}
          onPageChange={() => undefined}
        />

        <DataTable
          data={suppliers}
          columns={[
            { key: "name", header: "Name", render: (supplier) => supplier.name },
            { key: "email", header: "Email", render: (supplier) => supplier.contactEmail },
            { key: "phone", header: "Phone", render: (supplier) => supplier.phone },
            {
              key: "action",
              header: "Action",
              render: (supplier) => (
                <Button variant="danger" onClick={() => currentUser && void deleteSupplier(supplier.id, currentUser.id).then(load)}>
                  Delete
                </Button>
              ),
            },
          ]}
          emptyMessage="No suppliers found."
          page={1}
          totalPages={1}
          onPageChange={() => undefined}
        />
      </section>

      <section className="rounded-lg border border-line bg-elevated p-5 shadow-sm dark:shadow-none">
        <h3 className="mb-4 font-display text-lg font-medium text-primary">Profile Settings</h3>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submitProfile}>
          <Input placeholder="Name" error={profileForm.formState.errors.name?.message} {...profileForm.register("name")} />
          <Input
            type="password"
            placeholder="New password (optional)"
            error={profileForm.formState.errors.password?.message}
            {...profileForm.register("password")}
          />
          <div className="flex justify-end md:col-span-2">
            <Button type="submit">Save Profile</Button>
          </div>
        </form>
      </section>
    </div>
  );
}
