/**
 * @file packages/ui/src/renderer/cells/SpacerCellRenderer.tsx
 * @layer ui/renderer/cells
 *
 * @description
 * Cell renderer site/preview : rendu d’un spacer vertical.
 *
 * @remarks
 * - UI-only : consomme une shape déjà validée (schema).
 * - Le rendu repose uniquement sur la taille (`size`) et le skin.
 * - Aucun contenu visuel, uniquement un espace de mise en page.
 */

import type { SpacerCellShape } from "@compoz/validation/pages/blocks/cells/cell";

import { cn } from "@compoz/ui/lib/utils";
import type { SiteSpacerUi } from "@compoz/ui/site/site-ui.types";

export type SpacerCellRendererProps = Readonly<{
  cell?: SpacerCellShape | null;
  ui: SiteSpacerUi;
}>;

export function SpacerCellRenderer({ cell, ui }: SpacerCellRendererProps) {
  if (!cell) return null;

  const size = cell.size ?? "md";

  return (
    <div
      aria-hidden="true"
      data-cell="spacer"
      data-size={size}
      className={cn(ui.root, ui.size[size])}
    />
  );
}

SpacerCellRenderer.displayName = "SpacerCellRenderer";
