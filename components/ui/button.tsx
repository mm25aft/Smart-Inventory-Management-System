"use client";

import { forwardRef } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-hover active:scale-[0.98] disabled:hover:bg-accent",
  secondary:
    "border border-line bg-transparent text-primary hover:bg-subtle active:scale-[0.98]",
  ghost:
    "border border-transparent bg-transparent text-secondary hover:bg-subtle hover:text-primary active:scale-[0.98]",
  danger:
    "border border-line bg-transparent text-danger hover:border-danger/30 hover:bg-danger/5 active:scale-[0.98]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-primary transition duration-100 ease-out [&_svg]:size-4 [&_svg]:stroke-[1.5] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
});
