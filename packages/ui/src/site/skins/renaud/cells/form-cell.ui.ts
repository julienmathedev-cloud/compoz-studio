/**
 * @file packages/ui/src/site/skins/renaud/cells/form-cell.ui.ts
 * @layer ui/site/skins/renaud/cells
 *
 * @description
 * Defines the Renaud skin overrides for form cells.
 */

import type { SiteFormUiOverride } from "@compoz/ui/site/site-ui.types";

export const renaudFormUi: SiteFormUiOverride = {
  footer:
    "group-data-[variant=default]/card:group-data-[visual-mode=vanilla]/card:bg-background",
} as const;
