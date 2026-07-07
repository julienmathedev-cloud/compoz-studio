/**
 * @file apps/studio/src/components/atoms/badges/StatusBadge.tsx
 * @layer studio/atoms
 *
 * @description
 * Generic status badge used as the base building block for scoped Studio badges
 * such as diff, publication, and settings badges.
 *
 * @remarks
 * - Returns `null` when the trimmed label is empty to avoid rendering an empty badge.
 */

import { Badge } from "@compoz/ui/components/ui/badge";

export type StatusBadgeVariant = "success" | "warning" | "info" | "error";

export type StatusBadgeProps = Readonly<{
  variant: StatusBadgeVariant;
  label: string;
  className?: string;
}>;

export function StatusBadge({ variant, label, className }: StatusBadgeProps) {
  const text = label.trim();
  if (!text) return null;

  return (
    <Badge visualMode="studio" variant={variant} className={className}>
      {text}
    </Badge>
  );
}

StatusBadge.displayName = "StatusBadge";
