import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium select-none transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover",
        accent: "bg-brass-500 text-navy-950 shadow-xs hover:bg-brass-300",
        secondary: "bg-surface text-foreground border border-border shadow-xs hover:bg-surface-muted hover:border-border-strong",
        ghost: "text-foreground hover:bg-ink-100",
        subtle: "bg-ink-100 text-foreground hover:bg-ink-150",
        danger: "bg-danger text-white shadow-xs hover:bg-danger/90",
        "danger-ghost": "text-danger hover:bg-danger-soft",
        link: "text-accent-strong underline-offset-4 hover:underline px-0 h-auto",
        "on-dark": "bg-white/10 text-white border border-white/15 hover:bg-white/15",
      },
      size: {
        sm: "h-8 rounded-md px-3 text-[13px] [&_svg]:size-3.5",
        md: "h-9 rounded-md px-4 text-sm [&_svg]:size-4",
        lg: "h-11 rounded-md px-5 text-[15px] [&_svg]:size-4",
        icon: "size-9 rounded-md [&_svg]:size-4",
        "icon-sm": "size-8 rounded-md [&_svg]:size-4",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean; loading?: boolean };

export function Button({ className, variant, size, asChild, loading, disabled, children, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Loader2 className="animate-spin" aria-hidden />}
          {children}
        </>
      )}
    </Comp>
  );
}
