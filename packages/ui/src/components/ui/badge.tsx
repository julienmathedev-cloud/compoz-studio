import * as Slot from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@compoz/ui/lib/utils";

const badgeVariants = cva("", {
  variants: {
    visualMode: {
      vanilla:
        "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap motion-safe:transition-all outline-none focus-visible:border-ring/80 focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-0 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:pointer-events-none [&>svg]:size-3!",
      studio:
        "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-md border border-transparent px-2 py-0.5 text-sm font-medium motion-safe:transition-colors motion-reduce:transition-none outline-none focus-visible:border-ring/80 focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-0 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:pointer-events-none [&>svg]:size-3!",
    },
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary/80",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      destructive:
        "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 hover:bg-destructive/20",
      outline:
        "border-border text-foreground hover:bg-accent hover:text-accent-foreground",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
      error: "",
      success: "",
      warning: "",
      info: "",
    },
  },
  compoundVariants: [
    {
      variant: "error",
      visualMode: "studio",
      className:
        "bg-destructive/5 border-destructive/50 text-destructive/90 focus-visible:ring-destructive/60 dark:focus-visible:ring-destructive/40 dark:bg-destructive/20",
    },
    {
      variant: "success",
      visualMode: "studio",
      className:
        "bg-[color:var(--success-foreground)] border-[color:var(--success-border)] text-success",
    },
    {
      variant: "warning",
      visualMode: "studio",
      className:
        "bg-[color:var(--warning-foreground)] border-[color:var(--warning-border)] text-warning",
    },
    {
      variant: "info",
      visualMode: "studio",
      className:
        "bg-[color:var(--info-foreground)] border-[color:var(--info-border)] text-info",
    },
  ],
  defaultVariants: {
    variant: "default",
    visualMode: "vanilla",
  },
});

type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
  };

function Badge({
  className,
  variant = "default",
  visualMode = "vanilla",
  asChild = false,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      data-visual-mode={visualMode}
      className={cn(badgeVariants({ variant, visualMode }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
