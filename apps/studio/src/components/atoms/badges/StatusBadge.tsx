/**
 * @file apps/studio/src/components/atoms/badges/StatusBadge.tsx
 * @layer ui/atoms
 *
 * @description
 * Badge générique (variant + label). Sert de brique de base aux badges “scopés”.
 */

import { Badge } from "@compoz/ui/components/ui/badge";

export type StatusBadgeVariant = "success" | "warning" | "info" | "destructive";

export type StatusBadgeProps = Readonly<{
  variant: StatusBadgeVariant;
  label: string;
  className?: string;
}>;

export function StatusBadge({ variant, label, className }: StatusBadgeProps) {
  const text = String(label ?? "").trim();
  if (!text) return null;

  return (
    <Badge variant={variant} className={className}>
      {text}
    </Badge>
  );
}

StatusBadge.displayName = "StatusBadge";
