import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

// Native <select> styled like the inputs: fastest to use with a keyboard, works
// without JavaScript, and submits with the form.
export function NativeSelect({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm shadow-xs outline-none",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        "disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        className,
      )}
      {...props}
    />
  );
}
