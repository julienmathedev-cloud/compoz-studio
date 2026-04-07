/**
 * @file packages/ui/src/renderer/cells/SpacerCellRenderer.tsx
 * @layer ui/renderer/cells
 *
 * @description
 * Cell renderer site/preview : rendu d’un spacer vertical.
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
    // base = mobile
    v.mobile ? "block" : "hidden",

    // tablet
    v.tablet ? "md:block" : "md:hidden",

    // desktop
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
