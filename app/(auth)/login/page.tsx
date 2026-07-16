"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginWithEmail } from "@/lib/auth";
import { loginSchema, type LoginValues } from "@/lib/validators";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      setError(null);
      const user = await loginWithEmail(values.email, values.password);
      setUser(user);
      router.replace("/dashboard");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to sign in.");
    }
  });

  return (
    <div className="w-full max-w-[400px] rounded-lg border border-line bg-elevated p-10 shadow-sm dark:shadow-none">
      <div className="mb-8">
        <div className="flex items-center gap-1">
          <span className="font-display text-2xl font-medium text-primary">Stock</span>
          <span className="text-accent">.</span>
        </div>
        <p className="mt-2 text-sm text-muted">Inventory, predicted.</p>
      </div>

      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold text-primary">Sign in</h1>
        <p className="mt-2 text-sm text-secondary">Use your Firebase email and password to access the dashboard.</p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-xs font-medium uppercase tracking-[0.02em] text-muted">Email</span>
          <Input
            type="email"
            placeholder="admin@stock.local"
            error={form.formState.errors.email?.message}
            {...form.register("email")}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-xs font-medium uppercase tracking-[0.02em] text-muted">Password</span>
          <Input
            type="password"
            placeholder="••••••••"
            error={form.formState.errors.password?.message}
            {...form.register("password")}
          />
        </label>

        {error ? (
          <p className="rounded-md border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
