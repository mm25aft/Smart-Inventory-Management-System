"use client";

import { forwardRef } from "react";

import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, error, ...props },
  ref,
) {
  return (
    <div className="space-y-2">
      <textarea
        ref={ref}
        className={cn(
          "min-h-20 w-full resize-y rounded-md border border-line bg-elevated px-3 py-2 text-sm text-primary outline-none placeholder:text-muted focus:border-focus focus:shadow-[0_0_0_3px_rgba(91,106,240,0.12)]",
          error && "border-danger focus:border-danger focus:shadow-[0_0_0_3px_rgba(192,57,43,0.12)]",
          className,
        )}
        {...props}
      />
      {error ? <p className="text-xs font-medium text-danger">{error}</p> : null}
    </div>
  );
});
