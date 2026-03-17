import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@compoz/ui/lib/utils";

const inputVariants = cva(
  "h-8 w-full min-w-0 rounded-lg border px-2.5 py-1 outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        defaultVanilla:
          "border-input bg-transparent text-base motion-safe:transition-colors motion-reduce:transition-none file:text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:bg-input/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",

        defaultStudio:
          "border-input bg-transparent text-sm motion-safe:transition-colors motion-reduce:transition-none dark:bg-input/30 disabled:bg-input/50 dark:disabled:bg-input/80 motion-safe:focus-visible:border-none motion-safe:focus-visible:ring-2 motion-safe:focus-visible:ring-ring/70 motion-safe:focus-visible:ring-offset-0 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 aria-invalid:ring-destructive/60 dark:aria-invalid:ring-destructive/40 motion-safe:aria-invalid:ring-2 motion-safe:focus-visible:aria-invalid:ring-destructive/60 dark:motion-safe:focus-visible:aria-invalid:ring-destructive/40 file:text-foreground",
      },
    },
    defaultVariants: {
      variant: "defaultVanilla",
    },
  },
);

function Input({
  className,
  type,
  variant = "defaultVanilla",
  ...props
}: React.ComponentProps<"input"> & VariantProps<typeof inputVariants>) {
  return (
    <input
      type={type}
      data-slot="input"
      data-variant={variant}
      className={cn(inputVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Input };
