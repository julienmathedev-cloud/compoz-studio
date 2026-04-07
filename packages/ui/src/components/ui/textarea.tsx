import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@compoz/ui/lib/utils";

type TextareaVisualMode = "vanilla" | "studio";

const textareaVariants = cva(
  "flex field-sizing-content min-h-16 w-full rounded-lg border px-2.5 py-2 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "",
      },
      visualMode: {
        vanilla:
          "border-input bg-transparent text-base motion-safe:transition-colors motion-reduce:transition-none focus-visible:border-ring/80 focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-0 disabled:bg-input/50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/60 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",

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

function Textarea({
  className,
  variant = "default",
  visualMode = "vanilla",
  ...props
}: React.ComponentProps<"textarea"> &
  VariantProps<typeof textareaVariants> & {
    visualMode?: TextareaVisualMode;
  }) {
  return (
    <textarea
      data-slot="textarea"
      data-variant={variant}
      data-visual-mode={visualMode}
      className={cn(textareaVariants({ variant, visualMode }), className)}
      {...props}
    />
  );
}

export { Textarea };
