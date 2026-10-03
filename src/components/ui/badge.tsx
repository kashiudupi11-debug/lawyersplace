import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

export const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11.5px] font-medium leading-4",
  {
    variants: {
      tone: {
        neutral: "border-ink-200 bg-ink-100 text-ink-700",
        navy: "border-navy-100 bg-navy-50 text-navy-800",
        brass: "border-brass-300/60 bg-brass-100 text-brass-700",
        success: "border-success/20 bg-success-soft text-success",
        warning: "border-warning/20 bg-warning-soft text-warning",
        danger: "border-danger/20 bg-danger-soft text-danger",
        info: "border-info/20 bg-info-soft text-info",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;

/** Pass `dot` to add a leading dot. Text always carries the meaning, never color alone. */
export function Badge({
  className,
  tone,
  dot,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants> & { dot?: boolean }) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}
