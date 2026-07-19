"use client";

import { forwardRef } from "react";

import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, error, ...props },
  ref,
) {
  return (
    <div className="space-y-2">
      <input
        ref={ref}
        className={cn(
          "h-9 w-full rounded-md border border-line bg-elevated px-3 text-sm text-primary outline-none placeholder:text-muted focus:border-focus focus:shadow-[0_0_0_3px_rgba(91,106,240,0.12)]",
          error && "border-danger focus:border-danger focus:shadow-[0_0_0_3px_rgba(192,57,43,0.12)]",
          className,
        )}
        {...props}
      />
      {error ? <p className="text-xs font-medium text-danger">{error}</p> : null}
    </div>
  );
});
