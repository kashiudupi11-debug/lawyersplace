"use client";

import * as React from "react";
import { DropdownMenu as M, Tooltip as T, Tabs as Tb } from "radix-ui";
import { cn } from "@/lib/cn";

// ── Dropdown menu ──
export const Menu = M.Root;
export const MenuTrigger = M.Trigger;

export function MenuContent({ className, align = "end", ...props }: React.ComponentProps<typeof M.Content>) {
  return (
    <M.Portal>
      <M.Content
        align={align}
        sideOffset={6}
        className={cn(
          "z-50 min-w-48 overflow-hidden rounded-md border border-border bg-surface p-1 shadow-lg data-[state=open]:animate-fade-in",
          className,
        )}
        {...props}
      />
    </M.Portal>
  );
}

export function MenuItem({ className, destructive, ...props }: React.ComponentProps<typeof M.Item> & { destructive?: boolean }) {
  return (
    <M.Item
      className={cn(
        "flex cursor-default select-none items-center gap-2 rounded-sm px-2.5 py-1.5 text-sm outline-none data-[highlighted]:bg-ink-100 data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:text-subtle",
        destructive && "text-danger data-[highlighted]:bg-danger-soft [&_svg]:text-danger",
        className,
      )}
      {...props}
    />
  );
}

export const MenuSeparator = () => <M.Separator className="-mx-1 my-1 h-px bg-border" />;
export const MenuLabel = ({ children }: { children: React.ReactNode }) => (
  <M.Label className="px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wider text-subtle">{children}</M.Label>
);

// ── Tooltip ──
export const TooltipProvider = T.Provider;

export function Tooltip({ content, children, side = "top" }: { content: React.ReactNode; children: React.ReactElement; side?: "top" | "right" | "bottom" | "left" }) {
  return (
    <T.Root delayDuration={250}>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content
          side={side}
          sideOffset={6}
          className="z-50 max-w-xs rounded-md bg-navy-950 px-2.5 py-1.5 text-xs text-white shadow-md data-[state=delayed-open]:animate-fade-in"
        >
          {content}
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}

// ── Tabs (underline style; scrolls horizontally on mobile) ──
export const Tabs = Tb.Root;
export const TabsContent = Tb.Content;

export function TabsList({ className, ...props }: React.ComponentProps<typeof Tb.List>) {
  return (
    <Tb.List
      className={cn("-mb-px flex gap-1 overflow-x-auto border-b border-border [scrollbar-width:none]", className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof Tb.Trigger>) {
  return (
    <Tb.Trigger
      className={cn(
        "relative shrink-0 whitespace-nowrap px-3 py-2.5 text-sm font-medium text-subtle transition-colors hover:text-foreground",
        "after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-transparent",
        "data-[state=active]:text-foreground data-[state=active]:after:bg-brass-500",
        className,
      )}
      {...props}
    />
  );
}
