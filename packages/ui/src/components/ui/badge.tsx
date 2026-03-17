import * as Slot from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@compoz/ui/lib/utils";

const badgeBaseStudio =
  "inline-flex items-center justify-center w-fit h-5 gap-1 overflow-hidden whitespace-nowrap shrink-0 rounded-md border border-transparent px-2 py-0.5 text-sm font-medium motion-safe:transition-colors motion-reduce:transition-none outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-0 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:ring-destructive/60 aria-invalid:ring-2 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!";

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap motion-safe:transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        defaultVanilla:
          "bg-primary text-primary-foreground [a]:hover:bg-primary/80",

        secondaryVanilla:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",

        destructiveVanilla:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",

        outlineVanilla:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",

        ghostVanilla:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",

        linkVanilla: "text-primary underline-offset-4 hover:underline",

        defaultStudio: `${badgeBaseStudio} bg-primary text-primary-foreground [a]:hover:bg-primary/80`,

        secondaryStudio: `${badgeBaseStudio} bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80`,

        errorStudio: `${badgeBaseStudio} bg-destructive/5 border-destructive/50 text-destructive/90 [a]:hover:bg-destructive/20 focus-visible:ring-destructive/60 dark:focus-visible:ring-destructive/40 dark:bg-destructive/20`,

        outlineStudio: `${badgeBaseStudio} border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground`,

        ghostStudio: `${badgeBaseStudio} hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50`,

        linkStudio: `${badgeBaseStudio} text-primary underline-offset-4 hover:underline`,

        successStudio: `${badgeBaseStudio} bg-[color:var(--success-foreground)] border-[color:var(--success-border)] text-success [a]:hover:border-success/80`,

        warningStudio: `${badgeBaseStudio} bg-[color:var(--warning-foreground)] border-[color:var(--warning-border)] text-warning [a]:hover:border-warning/80`,

        infoStudio: `${badgeBaseStudio} bg-[color:var(--info-foreground)] border-[color:var(--info-border)] text-info [a]:hover:border-info/80`,
      },
    },
    defaultVariants: {
      variant: "defaultVanilla",
    },
  },
);

function Badge({
  className,
  variant = "defaultVanilla",
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
