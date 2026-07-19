"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  ContactRound,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import type { UserRole } from "@/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "MANAGER", "VIEWER"] },
  { href: "/inventory", label: "Inventory", icon: Boxes, roles: ["ADMIN", "MANAGER", "VIEWER"] },
  { href: "/customers", label: "Customers", icon: ContactRound, roles: ["ADMIN", "MANAGER", "VIEWER"] },
  { href: "/predictions", label: "Predictions", icon: BrainCircuit, roles: ["ADMIN", "MANAGER", "VIEWER"] },
  { href: "/analytics", label: "Analytics", icon: BarChart3, roles: ["ADMIN", "MANAGER", "VIEWER"] },
  { href: "/users", label: "Users", icon: Users, roles: ["ADMIN"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["ADMIN", "MANAGER"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const [collapsed, setCollapsed] = useState(false);

  const filteredItems = navItems.filter((item) => (user ? item.roles.includes(user.role) : false));

  return (
    <>
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 self-start border-r border-line bg-surface lg:flex lg:flex-col",
          collapsed ? "w-14" : "w-[220px]",
        )}
      >
        <div className="flex h-12 items-center border-b border-line px-4">
          <div className={cn("flex items-center gap-1 overflow-hidden", collapsed && "justify-center")}>
            {!collapsed ? (
              <>
                <span className="font-display text-base font-medium text-primary">Stock</span>
                <span className="mt-0.5 text-accent">.</span>
              </>
            ) : (
              <span className="font-display text-base font-medium text-primary">S</span>
            )}
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-2 py-3">
          {filteredItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-9 items-center gap-3 border-l-2 px-3 text-sm transition duration-100 ease-out",
                  active
                    ? "border-accent bg-subtle font-medium text-primary"
                    : "border-transparent text-secondary hover:bg-subtle hover:text-primary",
                  collapsed && "justify-center px-0",
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-4 w-4 shrink-0 stroke-[1.5]" />
                {!collapsed ? <span>{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-line p-2">
          <button
            type="button"
            onClick={() => setCollapsed((current) => !current)}
            className={cn(
              "inline-flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm text-secondary transition duration-100 ease-out hover:bg-subtle hover:text-primary",
              collapsed && "justify-center px-0",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4 stroke-[1.5]" /> : <ChevronLeft className="h-4 w-4 stroke-[1.5]" />}
            {!collapsed ? <span>Collapse</span> : null}
          </button>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface p-2 lg:hidden">
        <div className="grid grid-cols-5 gap-2">
          {filteredItems.slice(0, 5).map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-md border border-transparent px-2 py-2 text-[11px] font-medium transition duration-100 ease-out",
                  active ? "bg-subtle text-primary" : "text-secondary hover:bg-subtle hover:text-primary",
                )}
              >
                <item.icon className="h-4 w-4 stroke-[1.5]" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
