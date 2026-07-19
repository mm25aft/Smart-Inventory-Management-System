"use client";

import { forwardRef } from "react";

import { cn } from "@/lib/utils";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, error, children, ...props },
  ref,
) {
  return (
    <div className="space-y-2">
      <select
        ref={ref}
        className={cn(
          "h-9 w-full rounded-md border border-line bg-elevated px-3 text-sm text-primary outline-none focus:border-focus focus:shadow-[0_0_0_3px_rgba(91,106,240,0.12)]",
          error && "border-danger focus:border-danger focus:shadow-[0_0_0_3px_rgba(192,57,43,0.12)]",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error ? <p className="text-xs font-medium text-danger">{error}</p> : null}
    </div>
  );
});
