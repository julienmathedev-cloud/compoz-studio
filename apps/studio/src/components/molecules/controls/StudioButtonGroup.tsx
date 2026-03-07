/**
 * @file apps/studio/src/components/molecules/controls/StudioButtonGroup.tsx
 * @layer studio/molecules
 *
 * @description
 * Groupe de boutons “studio-safe” compatible avec les wrappers de type tooltip.
 *
 * @remarks
 * - Molecule UI : wrapper autour de `ButtonGroup` (UI shared).
 * - Garantit un rendu cohérent des jointures même si un bouton est wrappé
 *   (ex. `TooltipButton` désactivé → `span > button`).
 * - Applique les styles de jointure pour :
 *   1) `Group > Button`
 *   2) `Group > span > Button`
 * - Strictement UI-only : aucune logique métier.
 */

import type { ReactNode } from "react";

import { ButtonGroup } from "@compoz/ui/components/ui/button-group";
import { cn } from "@compoz/ui/lib/utils";

/**
 * Props du composant `StudioButtonGroup`.
 */
export type StudioButtonGroupProps = Readonly<{
  /** Boutons enfants à grouper. */
  children?: ReactNode;
  /** Classes additionnelles appliquées au groupe. */
  className?: string;
}>;

/**
 * Groupe de boutons avec gestion robuste des wrappers (Studio).
 */
export function StudioButtonGroup({
  children,
  className,
}: StudioButtonGroupProps) {
  return (
    <ButtonGroup
      className={cn(
        // ✅ Fix “2 niveaux” : quand un enfant est wrappé (span > button)
        "[&>*>*]:rounded-none " +
          "[&>*:first-child>*]:rounded-l-md " +
          "[&>*:last-child>*]:rounded-r-md " +
          "[&>*:not(:first-child)>*]:-ml-px",
        className,
      )}
    >
      {children}
    </ButtonGroup>
  );
}

StudioButtonGroup.displayName = "StudioButtonGroup";
