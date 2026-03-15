/**
 * @file packages/ui/src/site/skins/default/cells/spacer-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — spacer cell (thème Default).
 */

import type { SiteSpacerUi } from "@compoz/ui/site/site-ui.types";

export const defaultSpacerUi: SiteSpacerUi = {
  root: "w-full shrink-0",
  size: {
    sm: "h-4",
    md: "h-8",
    lg: "h-12",
    xl: "h-16",
  },
} as const;
