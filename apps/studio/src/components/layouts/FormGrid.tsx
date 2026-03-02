"use client";

/**
 * @file apps/studio/src/components/layouts/FormGrid.tsx
 * @layer ui/layouts
 *
 * @description
 * Grille responsive standard pour les formulaires d’administration.
 *
 * @remarks
 * - UI-only : aucune logique métier ni état interne.
 * - Encapsule les classes de grille responsive (1 colonne → 2 colonnes ≥ sm).
 * - Évite la duplication des classes Tailwind dans les sections de formulaires.
 */

import { cn } from "@compoz/ui/lib/utils";
import { GRID_SM_2 } from "@compoz/ui/styles/studio/layout";
import type { ReactNode } from "react";

/**
 * Props du composant `FormGrid`.
 */
type FormGridProps = Readonly<{
  /** Contenu de la grille (champs, groupes ou panneaux UI). */
  children: ReactNode;
  className?: string;
}>;

/**
 * Grille responsive utilitaire pour les formulaires (admin).
 */
export function FormGrid({ children, className }: FormGridProps) {
  return (
    <div
      className={cn(GRID_SM_2, className)}
      // Aucun attribut supplémentaire : composant strictement visuel
    >
      {children}
    </div>
  );
}

FormGrid.displayName = "FormGrid";
