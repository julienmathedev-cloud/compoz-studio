"use client";

import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@compoz/ui/lib/utils";

const toggleVariants = cva(
  "group/toggle inline-flex items-center justify-center gap-1 rounded-lg text-sm font-medium whitespace-nowrap outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      visualMode: {
        vanilla:
          "motion-safe:transition-[color,background-color,border-color,box-shadow] motion-reduce:transition-none hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-pressed:bg-muted data-[state=on]:bg-muted dark:aria-invalid:ring-destructive/40",
        studio:
          "motion-safe:transition-[color,background-color,border-color,box-shadow] motion-reduce:transition-none motion-safe:hover:bg-secondary motion-safe:hover:text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-0 aria-invalid:ring-destructive/60 aria-invalid:ring-2 dark:aria-invalid:ring-destructive/40 aria-pressed:bg-secondary data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground",
      },
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent data-[visual-mode=vanilla]:hover:bg-muted data-[visual-mode=studio]:motion-safe:hover:bg-muted",
      },
      size: {
        default: "h-8 min-w-8 px-2",
        sm: "h-7 min-w-7 rounded-[min(var(--radius-md),12px)] px-1.5 text-[0.8rem]",
        lg: "h-9 min-w-9 px-2.5",
      },
    },
    defaultVariants: {
      visualMode: "vanilla",
      variant: "default",
      size: "default",
    },
  },
);

function Toggle({
  className,
  visualMode = "vanilla",
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      data-visual-mode={visualMode}
      className={cn(toggleVariants({ visualMode, variant, size, className }))}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
