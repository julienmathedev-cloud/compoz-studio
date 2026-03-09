import * as React from "react";

import { cn } from "@compoz/ui/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input dark:bg-input/30 disabled:bg-input/50 dark:disabled:bg-input/80 rounded-lg border bg-transparent px-2.5 py-2 motion-safe:transition-colors text-sm placeholder:text-muted-foreground flex field-sizing-content min-h-16 w-full outline-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-0",
        "aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 aria-invalid:ring-destructive/60 dark:aria-invalid:ring-destructive/40 aria-invalid:ring-2 focus-visible:aria-invalid:ring-destructive/60 dark:focus-visible:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
