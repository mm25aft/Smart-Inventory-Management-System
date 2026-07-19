"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onOpenChange, title, description, children, className }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Content
            className={cn(
              "relative flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-md outline-none duration-150 ease-out data-[state=open]:translate-y-0 data-[state=open]:opacity-100 data-[state=closed]:translate-y-2 data-[state=closed]:opacity-0 dark:shadow-none",
              className,
            )}
          >
            <div className="mb-4 flex items-start justify-between gap-4 border-b border-line px-6 pb-4 pt-6">
              <div>
                <Dialog.Title className="font-display text-lg font-semibold text-primary">{title}</Dialog.Title>
                {description ? (
                  <Dialog.Description className="mt-1 text-sm text-secondary">
                    {description}
                  </Dialog.Description>
                ) : null}
              </div>
              <Dialog.Close className="inline-flex h-8 w-8 items-center justify-center rounded-md text-secondary transition duration-80 ease-out hover:bg-subtle hover:text-primary">
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>
            <div className="overflow-y-auto px-6 pb-6">{children}</div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
