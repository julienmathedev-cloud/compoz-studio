/**
 * @file packages/ui/src/renderer/cells/SeparatorCellRenderer.tsx
 * @layer ui/renderer/cells
 *
 * @description
 * Cell renderer site/preview : rendu d’un séparateur horizontal stylé.
 *
 * @remarks
 * - UI-only : consomme une shape déjà validée (schema).
 * - Le rendu repose sur `align`, `size` et le skin.
 * - Utilise une simple ligne décorative.
 */

import type { SeparatorCellShape } from "@compoz/validation/pages/blocks/cells/cell";

import { cn } from "@compoz/ui/lib/utils";
import type { SiteSeparatorUi } from "@compoz/ui/site/site-ui.types";

export type SeparatorCellRendererProps = Readonly<{
  cell?: SeparatorCellShape | null;
  ui: SiteSeparatorUi;
}>;

export function SeparatorCellRenderer({
  cell,
  ui,
}: SeparatorCellRendererProps) {
  if (!cell) return null;

  const align = cell.align ?? "center";
  const size = cell.size ?? "md";

  const isFull = align === "full";

  return (
    <div
      aria-hidden="true"
      data-cell="separator"
      data-align={align}
      data-size={size}
      className={cn(ui.root, ui.align[align])}
    >
      <div className={cn(ui.line, !isFull && ui.size[size])} />
    </div>
  );
}

SeparatorCellRenderer.displayName = "SeparatorCellRenderer";
