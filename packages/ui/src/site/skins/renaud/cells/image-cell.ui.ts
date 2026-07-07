/**
 * @file packages/ui/src/site/skins/renaud/cells/image-cell.ui.ts
 * @layer ui/site/skins/renaud/cells
 *
 * @description
 * Defines the Renaud skin overrides for image cells.
 */

import type { SiteImageUiOverride } from "@compoz/ui/site/site-ui.types";

export const renaudImageUi: SiteImageUiOverride = {
  container:
    "rounded-2xl border border-primary/40 p-1 shadow-2xl shadow-primary/30 bg-primary/10",
  imageDefault: "h-full w-full object-cover rounded-xl overflow-hidden",
} as const;
