import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@compoz/ui/lib/utils";

const textareaVariants = cva(
  "flex field-sizing-content min-h-16 w-full rounded-lg border px-2.5 py-2 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        defaultVanilla:
          "border-input bg-transparent text-base motion-safe:transition-colors motion-reduce:transition-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:bg-input/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",

        defaultStudio:
          "border-input bg-transparent text-sm motion-safe:transition-colors motion-reduce:transition-none dark:bg-input/30 disabled:bg-input/50 dark:disabled:bg-input/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-0 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 aria-invalid:ring-2 aria-invalid:ring-destructive/60 dark:aria-invalid:ring-destructive/40 focus-visible:aria-invalid:ring-destructive/60 dark:focus-visible:aria-invalid:ring-destructive/40",
      },
    },
    defaultVariants: {
      variant: "defaultVanilla",
    },
  },
);

function Textarea({
  className,
  variant = "defaultVanilla",
  ...props
}: React.ComponentProps<"textarea"> & VariantProps<typeof textareaVariants>) {
  return (
    <textarea
      data-slot="textarea"
      data-variant={variant}
      className={cn(textareaVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Textarea };
