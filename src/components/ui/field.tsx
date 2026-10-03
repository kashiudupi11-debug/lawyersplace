import * as React from "react";
import { cn } from "@/lib/cn";

const control =
  "w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground shadow-xs transition-[border-color,box-shadow] placeholder:text-ink-400 hover:border-border-strong focus-visible:outline-none focus-visible:border-brass-500 focus-visible:ring-3 focus-visible:ring-brass-500/20 disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-subtle aria-invalid:border-danger aria-invalid:focus-visible:ring-danger/15";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, "h-9", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, "min-h-24 py-2 leading-relaxed", className)} {...props} />;
}

/** Native select: fully accessible, and uses the platform picker on mobile. */
export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        control,
        "h-9 appearance-none bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%236b7280' stroke-width='1.6' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")] bg-[length:16px] bg-[right_10px_center] bg-no-repeat pr-9",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-[13px] font-medium text-ink-700", className)} {...props} />;
}

type FieldProps = {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: React.ReactNode;
  error?: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * Label + control + hint/error, wired for screen readers. Pass the same id to the
 * control and use `aria-describedby={describedBy(id, …)}`.
 */
export function Field({ label, htmlFor, required, hint, error, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && (
          <span className="ml-0.5 text-danger" aria-hidden>
            *
          </span>
        )}
      </Label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-xs text-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function describedBy(id: string, error?: string, hint?: unknown) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}

export function Checkbox({ className, ...props }: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  return (
    <input
      type="checkbox"
      className={cn("size-4 rounded border-border-strong accent-navy-900 focus-visible:outline-ring", className)}
      {...props}
    />
  );
}
