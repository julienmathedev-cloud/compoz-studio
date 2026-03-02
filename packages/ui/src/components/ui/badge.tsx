import * as Slot from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@compoz/ui/lib/utils";

const badgeVariants = cva(
  "h-5 gap-1 rounded-md border border-transparent px-2 py-0.5 text-sm font-medium motion-safe:transition-colors motion-reduce:transition-none has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:size-3! inline-flex items-center justify-center w-fit whitespace-nowrap shrink-0 [&>svg]:pointer-events-none outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-0 aria-invalid:ring-destructive/60 aria-invalid:ring-2 dark:aria-invalid:ring-destructive/40 overflow-hidden group/badge",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/5 border-destructive/50  [a]:hover:bg-destructive/20 focus-visible:ring-destructive/60 dark:focus-visible:ring-destructive/40 text-destructive/90 dark:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",

        success:
          "bg-[color:var(--success-foreground)] border-[color:var(--success-border)] text-success [a]:hover:border-success/80",
        warning:
          "bg-[color:var(--warning-foreground)] border-[color:var(--warning-border)] text-warning [a]:hover:border-warning/80",
        info: "bg-[color:var(--info-foreground)] border-[color:var(--info-border)] text-info [a]:hover:border-info/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
