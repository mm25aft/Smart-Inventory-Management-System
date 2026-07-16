"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { inviteUserAccount } from "@/lib/auth";
import { listUsers, saveUserProfile } from "@/lib/firestore";
import { userInviteSchema, type UserInviteValues } from "@/lib/validators";
import { useAuthStore } from "@/store/authStore";
import type { AppUser, UserRole } from "@/types";

export default function UsersPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [users, setUsers] = useState<AppUser[]>([]);

  const form = useForm<UserInviteValues>({
    resolver: zodResolver(userInviteSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "VIEWER",
    },
  });

  const loadUsers = useCallback(async () => {
    const nextUsers = await listUsers();
    setUsers(nextUsers);
  }, []);

  useEffect(() => {
    let active = true;

    void listUsers().then((nextUsers) => {
      if (active) {
        setUsers(nextUsers);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const submit = form.handleSubmit(async (values) => {
    if (!currentUser) {
      return;
    }

    await inviteUserAccount({ ...values, performedBy: currentUser.id });
    form.reset({ name: "", email: "", password: "", role: "VIEWER" });
    await loadUsers();
  });

  const updateUser = async (user: AppUser, payload: Partial<Pick<AppUser, "role" | "isActive">>) => {
    if (!currentUser) {
      return;
    }

    await saveUserProfile(user.id, payload, currentUser.id);
    await loadUsers();
  };

  return (
    <div className="space-y-8">
      <Header title="Users" description="Invite teammates, assign roles, and control account access." />

      <section className="rounded-lg border border-line bg-elevated p-5 shadow-sm dark:shadow-none">
        <h3 className="mb-4 font-display text-lg font-medium text-primary">Invite User</h3>
        <form className="grid gap-4 md:grid-cols-4" onSubmit={submit}>
          <Input placeholder="Full name" error={form.formState.errors.name?.message} {...form.register("name")} />
          <Input placeholder="Email" error={form.formState.errors.email?.message} {...form.register("email")} />
          <Input type="password" placeholder="Temporary password" error={form.formState.errors.password?.message} {...form.register("password")} />
          <Select error={form.formState.errors.role?.message} {...form.register("role")}>
            <option value="VIEWER">Viewer</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </Select>
          <div className="flex justify-end md:col-span-4">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Inviting..." : "Invite User"}
            </Button>
          </div>
        </form>
      </section>

      <DataTable
        data={users}
        columns={[
          {
            key: "name",
            header: "Name",
            render: (user) => (
              <div>
                <p className="font-medium text-primary">{user.name}</p>
                <p className="text-xs text-secondary">{user.email}</p>
              </div>
            ),
          },
          {
            key: "role",
            header: "Role",
            render: (user) => (
              <Select
                value={user.role}
                onChange={(event) => void updateUser(user, { role: event.target.value as UserRole })}
              >
                <option value="VIEWER">Viewer</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </Select>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (user) => (
              <span
                className={
                  user.isActive
                    ? "inline-flex h-5 items-center rounded-md border border-success/20 bg-success/10 px-2 text-xs font-medium text-success"
                    : "inline-flex h-5 items-center rounded-md border border-line bg-subtle px-2 text-xs font-medium text-secondary"
                }
              >
                {user.isActive ? "Active" : "Inactive"}
              </span>
            ),
          },
          {
            key: "actions",
            header: "Actions",
            render: (user) => (
              <Button
                variant={user.isActive ? "danger" : "secondary"}
                onClick={() => void updateUser(user, { isActive: !user.isActive })}
              >
                {user.isActive ? "Deactivate" : "Reactivate"}
              </Button>
            ),
          },
        ]}
        emptyMessage="No users found."
        page={1}
        totalPages={1}
        onPageChange={() => undefined}
      />
    </div>
  );
}
