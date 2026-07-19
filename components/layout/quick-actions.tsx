"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

const buttonClass =
  "inline-flex h-9 items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition duration-100 ease-out";

export function QuickActions() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="flex flex-wrap gap-3">
      {(user?.role === "ADMIN" || user?.role === "MANAGER") && (
        <>
          <Link href="/inventory" className={cn(buttonClass, "bg-accent text-white hover:bg-accent-hover")}>
            Add Inventory
          </Link>
          <Link href="/predictions" className={cn(buttonClass, "border border-line text-primary hover:bg-subtle")}>
            View Predictions
          </Link>
        </>
      )}
      {user?.role === "ADMIN" && (
        <Link href="/users" className={cn(buttonClass, "border border-line text-primary hover:bg-subtle")}>
          Manage Users
        </Link>
      )}
      <Link href="/analytics" className={cn(buttonClass, "text-secondary hover:bg-subtle hover:text-primary")}>
        Open Analytics
      </Link>
    </div>
  );
}
