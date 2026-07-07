/**
 * @file packages/ui/src/renderer/cells/SpacerCellRenderer.tsx
 * @layer ui/renderer/cells
 *
 * @description
 * Renders a validated vertical spacer cell.
 *
 * @remarks
 * Visibility classes are derived per breakpoint while the spacing size comes from the active skin.
 */

import type { SpacerCellShape } from "@compoz/validation/pages/blocks/cells/cell";

import { cn } from "@compoz/ui/lib/utils";
import type { SiteSpacerUi } from "@compoz/ui/site/site-ui.types";

export type SpacerCellRendererProps = Readonly<{
  cell?: SpacerCellShape | null;
  ui: SiteSpacerUi;
}>;

function getVisibilityClasses(
  visibility: SpacerCellShape["visibility"] | undefined,
) {
  const v = {
    mobile: visibility?.mobile ?? true,
    tablet: visibility?.tablet ?? true,
    desktop: visibility?.desktop ?? true,
  };

  return cn(
    v.mobile ? "block" : "hidden",
    v.tablet ? "md:block" : "md:hidden",
    v.desktop ? "lg:block" : "lg:hidden",
  );
}

export function SpacerCellRenderer({ cell, ui }: SpacerCellRendererProps) {
  if (!cell) return null;

  const size = cell.size ?? "md";

  const visibilityClasses = getVisibilityClasses(cell.visibility);

  return (
    <div
      aria-hidden="true"
      data-cell="spacer"
      data-size={size}
      className={cn(ui.root, ui.size[size], visibilityClasses)}
    />
  );
}

SpacerCellRenderer.displayName = "SpacerCellRenderer";
