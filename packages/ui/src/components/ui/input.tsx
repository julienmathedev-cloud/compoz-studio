import * as React from "react";

import { cn } from "@compoz/ui/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // ✅ PRM : animations/transitions/rings uniquement en motion-safe
        "dark:bg-input/30 border-input focus-visible:outline-none motion-safe:focus-visible:border-none motion-safe:focus-visible:ring-2 motion-safe:focus-visible:ring-ring/70 motion-safe:focus-visible:ring-offset-0 aria-invalid:ring-destructive/60 aria-invalid:border-none motion-safe:aria-invalid:ring-2 dark:aria-invalid:ring-destructive/40 dark:aria-invalid:border-destructive/50 disabled:bg-input/50 dark:disabled:bg-input/80 h-8 rounded-lg border bg-transparent px-2.5 py-1 text-sm motion-safe:transition-colors file:h-6 file:font-medium file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
