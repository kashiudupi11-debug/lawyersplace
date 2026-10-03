"use client";

import { Toaster as Sonner } from "sonner";

export { toast } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast: "!rounded-lg !border !border-border !bg-surface !shadow-lg !font-sans",
          title: "!text-sm !font-medium !text-foreground",
          description: "!text-[13px] !text-subtle",
        },
      }}
    />
  );
}
