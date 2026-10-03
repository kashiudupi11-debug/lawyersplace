"use client";

import * as React from "react";
import { Dialog as D } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

const overlay = "fixed inset-0 z-50 bg-navy-950/40 backdrop-blur-[2px] data-[state=open]:animate-fade-in";

/** Centered modal. On small screens it becomes a bottom sheet. */
export function DialogContent({
  title,
  description,
  children,
  className,
  size = "md",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const width = { sm: "sm:max-w-md", md: "sm:max-w-lg", lg: "sm:max-w-2xl", xl: "sm:max-w-4xl" }[size];
  return (
    <D.Portal>
      <D.Overlay className={overlay} />
      <D.Content
        className={cn(
          "fixed z-50 flex max-h-[92dvh] w-full flex-col bg-surface shadow-lg outline-none data-[state=open]:animate-slide-up",
          "inset-x-0 bottom-0 rounded-t-xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg",
          width,
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <D.Title className="font-display text-xl font-medium tracking-tight text-foreground">{title}</D.Title>
            {description ? (
              <D.Description className="mt-1 text-[13px] text-subtle">{description}</D.Description>
            ) : (
              <D.Description className="sr-only">{title}</D.Description>
            )}
          </div>
          <D.Close className="-mr-1 rounded-md p-1.5 text-subtle hover:bg-ink-100 hover:text-foreground" aria-label="Close">
            <X className="size-4" />
          </D.Close>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </D.Content>
    </D.Portal>
  );
}

/** Side panel for record details and quick edits; full-width on mobile. */
export function DrawerContent({
  title,
  description,
  children,
  className,
  footer,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}) {
  return (
    <D.Portal>
      <D.Overlay className={overlay} />
      <D.Content
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-surface shadow-lg outline-none data-[state=open]:animate-slide-in-right",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="min-w-0">
            <D.Title className="font-display text-xl font-medium tracking-tight">{title}</D.Title>
            {description ? (
              <D.Description className="mt-1 text-[13px] text-subtle">{description}</D.Description>
            ) : (
              <D.Description className="sr-only">Details</D.Description>
            )}
          </div>
          <D.Close className="-mr-2 rounded-md p-1.5 text-subtle hover:bg-ink-100 hover:text-foreground" aria-label="Close panel">
            <X className="size-4" />
          </D.Close>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-border bg-surface-muted px-6 py-3">{footer}</div>}
      </D.Content>
    </D.Portal>
  );
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("sticky bottom-0 flex flex-col-reverse gap-2 border-t border-border bg-surface-muted px-5 py-3 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}
