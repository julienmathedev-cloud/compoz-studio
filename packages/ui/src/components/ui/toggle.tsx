"use client";

import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@compoz/ui/lib/utils";

const toggleVariants = cva(
  // ✅ PRM : hover + transition uniquement en motion-safe
  "motion-safe:hover:text-accent-foreground aria-pressed:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-0 aria-invalid:ring-destructive/60 aria-invalid:ring-2 dark:aria-invalid:ring-destructive/40 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground gap-1 rounded-lg text-sm font-medium motion-safe:transition-all [&_svg:not([class*='size-'])]:size-4 group/toggle motion-safe:hover:bg-accent motion-safe:hover:text-accent-foreground inline-flex items-center justify-center whitespace-nowrap outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border-input motion-safe:hover:bg-muted border bg-transparent",
      },
      size: {
        default: "h-8 min-w-8 px-2",
        sm: "h-7 min-w-7 rounded-[min(var(--radius-md),12px)] px-1.5 text-[0.8rem]",
        lg: "h-9 min-w-9 px-2.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Toggle({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
