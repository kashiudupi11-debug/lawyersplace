import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Info, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon?: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", compact ? "px-4 py-8" : "px-6 py-14", className)}>
      {Icon && (
        <div className="mb-3 flex size-11 items-center justify-center rounded-full border border-border bg-surface-muted">
          <Icon className="size-5 text-ink-400" aria-hidden />
        </div>
      )}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[13px] text-subtle">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "rounded-md bg-ink-100 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)] bg-[length:400px_100%] bg-no-repeat animate-shimmer",
        className,
      )}
    />
  );
}

const calloutTones = {
  info: { icon: Info, cls: "border-info/20 bg-info-soft text-info" },
  warning: { icon: AlertTriangle, cls: "border-warning/25 bg-warning-soft text-warning" },
  danger: { icon: XCircle, cls: "border-danger/20 bg-danger-soft text-danger" },
  success: { icon: CheckCircle2, cls: "border-success/20 bg-success-soft text-success" },
} as const;

export function Callout({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: keyof typeof calloutTones;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const { icon: Icon, cls } = calloutTones[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex gap-3 rounded-md border px-3.5 py-3 text-[13px]", cls, className)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 text-ink-900">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={cn(title && "mt-0.5", "text-ink-700")}>{children}</div>}
      </div>
    </div>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-surface-muted px-1 font-mono text-[10.5px] font-medium text-subtle">
      {children}
    </kbd>
  );
}
