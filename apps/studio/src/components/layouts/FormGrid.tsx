"use client";

/**
 * @file apps/studio/src/components/layouts/FormGrid.tsx
 * @layer studio/layouts
 *
 * @description
 * Standard responsive grid for Studio forms.
 *
 * @remarks
 * - Encapsulates the shared one-column-to-two-column Studio form grid.
 * - Avoids duplicating Tailwind classes across form sections.
 */

import type { ReactNode } from "react";

import { cn } from "@compoz/ui/lib/utils";
import { GRID_SM_2 } from "@compoz/ui/styles/studio/layout";

type FormGridProps = Readonly<{
  children: ReactNode;
  className?: string;
}>;

export function FormGrid({ children, className }: FormGridProps) {
  return <div className={cn(GRID_SM_2, className)}>{children}</div>;
}

FormGrid.displayName = "FormGrid";
