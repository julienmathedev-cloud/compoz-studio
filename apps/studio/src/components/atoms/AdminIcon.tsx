"use client";

/**
 * @file apps/studio/src/components/atoms/AdminIcon.tsx
 * @layer ui/atoms
 *
 * @description
 * Icône normalisée pour l’interface d’administration.
 *
 * @remarks
 * - Atome UI : aucune logique métier.
 * - Applique une taille standardisée via les tokens UI.
 * - Peut hériter de la couleur du texte parent.
 * - Icône décorative par défaut (`aria-hidden="true"`).
 */

import { cn } from "@compoz/ui/lib/utils";
import type { ComponentType, SVGProps } from "react";

/**
 * Props du composant `AdminIcon`.
 */
export type AdminIconProps = Readonly<{
  /**
   * Composant SVG à rendre (Lucide, Simple Icons, SVG custom, etc.).
   */
  icon: ComponentType<SVGProps<SVGSVGElement>>;

  /** Classes additionnelles sur l’icône. */
  className?: string;
}>;

/**
 * Icône standardisée du back-office.
 */
export function AdminIcon({ icon: Icon, className }: AdminIconProps) {
  return <Icon className={cn(className)} aria-hidden="true" />;
}

AdminIcon.displayName = "AdminIcon";
