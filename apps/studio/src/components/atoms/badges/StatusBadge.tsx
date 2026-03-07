/**
 * @file apps/studio/src/components/atoms/badges/StatusBadge.tsx
 * @layer studio/atoms
 *
 * @description
 * Badge générique de statut (variant + label), utilisé comme brique de base
 * par les badges “scopés” du Studio (diff, publication, settings, etc.).
 *
 * @remarks
 * - Rend `null` si le label est vide après trim (évite d’afficher un badge vide).
 */

import { Badge } from "@compoz/ui/components/ui/badge";

export type StatusBadgeVariant = "success" | "warning" | "info" | "destructive";

export type StatusBadgeProps = Readonly<{
  variant: StatusBadgeVariant;
  label: string;
  className?: string;
}>;

/**
 * Badge de statut générique (variant + label).
 *
 * @remarks
 * - Rend `null` si `label.trim()` est vide (pas de badge vide).
 */
export function StatusBadge({ variant, label, className }: StatusBadgeProps) {
  const text = label.trim();
  if (!text) return null;

  return (
    <Badge variant={variant} className={className}>
      {text}
    </Badge>
  );
}

StatusBadge.displayName = "StatusBadge";
