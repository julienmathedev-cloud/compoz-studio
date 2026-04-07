import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@compoz/ui/lib/utils";

type InputVisualMode = "vanilla" | "studio";

const inputVariants = cva(
  "h-8 w-full min-w-0 rounded-lg border px-2.5 py-1 outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "",
      },
      visualMode: {
        vanilla:
          "border-input bg-transparent text-base motion-safe:transition-colors motion-reduce:transition-none file:text-sm focus-visible:border-ring/80 focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-0 disabled:bg-input/50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/60 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        studio:
          "border-input bg-transparent text-sm motion-safe:transition-colors motion-reduce:transition-none dark:bg-input/30 disabled:bg-input/50 dark:disabled:bg-input/80 focus-visible:border-ring/80 focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-0 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 aria-invalid:ring-2 aria-invalid:ring-destructive/60 dark:aria-invalid:ring-destructive/40",
      },
    },
    defaultVariants: {
      variant: "default",
      visualMode: "vanilla",
    },
  },
);

function Input({
  className,
  type,
  variant = "default",
  visualMode = "vanilla",
  ...props
}: React.ComponentProps<"input"> &
  VariantProps<typeof inputVariants> & {
    visualMode?: InputVisualMode;
  }) {
  return (
    <input
      type={type}
      data-slot="input"
      data-variant={variant}
      data-visual-mode={visualMode}
      className={cn(inputVariants({ variant, visualMode }), className)}
      {...props}
    />
  );
}

export { Input };
