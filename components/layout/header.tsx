"use client";

import { Bell, LogOut, Moon, Search, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { logoutCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

export function Header({ title, description }: { title: string; description: string }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const initials = useMemo(() => {
    const source = user?.name?.trim() || "Guest";
    return source
      .split(/\s+/)
      .slice(0, 2)
      .map((value) => value[0]?.toUpperCase() ?? "")
      .join("");
  }, [user?.name]);

  const handleLogout = async () => {
    await logoutCurrentUser();
    router.replace("/login");
  };

  const toggleTheme = () => {
    const nextDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextDark);
    document.documentElement.dataset.theme = nextDark ? "dark" : "light";
    localStorage.setItem("theme", nextDark ? "dark" : "light");
  };

  return (
    <header className="sticky top-0 z-20 -mx-4 mb-6 border-b border-line bg-surface px-4 py-3 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-medium text-primary">{title}</h2>
          <p className="mt-1 text-sm text-secondary">{description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
          <div className="relative w-full lg:w-[280px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              readOnly
              value=""
              placeholder="Search inventory..."
              className="h-8 w-full rounded-md border border-line bg-elevated pl-9 pr-3 text-sm text-primary outline-none placeholder:text-muted"
            />
          </div>

          <button
            type="button"
            aria-label="Notifications"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-secondary transition duration-80 ease-out hover:bg-subtle hover:text-primary"
          >
            <Bell className="h-4 w-4 stroke-[1.5]" />
          </button>

          <button
            type="button"
            aria-label="Toggle theme"
            onClick={toggleTheme}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-secondary transition duration-150 ease-out hover:bg-subtle hover:text-primary"
          >
            <Sun className="hidden h-4 w-4 stroke-[1.5] dark:block" />
            <Moon className="block h-4 w-4 stroke-[1.5] dark:hidden" />
          </button>

          <div className="flex items-center gap-2 rounded-md border border-line bg-elevated px-2 py-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-subtle font-mono text-xs text-primary">
              {initials}
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-medium text-primary">{user?.name ?? "Guest"}</p>
              <p className="text-xs uppercase tracking-[0.02em] text-muted">{user?.role ?? "No role"}</p>
            </div>
          </div>

          <Button variant="ghost" className={cn("h-8 w-8 px-0")} onClick={handleLogout} aria-label="Logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
