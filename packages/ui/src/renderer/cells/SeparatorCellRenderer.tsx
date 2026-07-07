/**
 * @file packages/ui/src/renderer/cells/SeparatorCellRenderer.tsx
 * @layer ui/renderer/cells
 *
 * @description
 * Renders a validated decorative separator cell.
 *
 * @remarks
 * The rendered line is aria-hidden and styled through align, size, and the active skin.
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
