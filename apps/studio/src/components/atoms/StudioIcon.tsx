/**
 * @file apps/studio/src/components/atoms/StudioIcon.tsx
 * @layer studio/atoms
 *
 * @description
 * Icône normalisée pour l’interface Studio.
 *
 * @remarks
 * - Atome UI : aucune logique métier.
 * - Applique une taille standardisée via les tokens UI.
 * - Peut hériter de la couleur du texte parent.
 * - Icône décorative par défaut (`aria-hidden="true"`).
 */

import type { ComponentType, SVGProps } from "react";

import { cn } from "@compoz/ui/lib/utils";

/**
 * Props du composant `StudioIcon`.
 */
export type StudioIconProps = Readonly<{
  /**
   * Composant SVG à rendre (Lucide, Simple Icons, SVG custom, etc.).
   */
  icon: ComponentType<SVGProps<SVGSVGElement>>;

  /** Classes additionnelles sur l’icône. */
  className?: string;
}>;

/**
 * Icône standardisée pour l’interface Studio.
 */
export function StudioIcon({ icon: Icon, className }: StudioIconProps) {
  return <Icon className={cn(className)} aria-hidden="true" />;
}

StudioIcon.displayName = "StudioIcon";
