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
          "motion-safe:transition-[color,background-color,border-color,box-shadow] motion-reduce:transition-none hover:bg-accent hover:text-accent-foreground focus-visible:border-ring/80 focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-0 aria-pressed:bg-accent data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",

        studio:
          "motion-safe:transition-[color,background-color,border-color,box-shadow] motion-reduce:transition-none hover:bg-accent hover:text-accent-foreground focus-visible:border-ring/80 focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-0 aria-pressed:bg-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
      },
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
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
      className={cn(toggleVariants({ visualMode, variant, size }), className)}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
