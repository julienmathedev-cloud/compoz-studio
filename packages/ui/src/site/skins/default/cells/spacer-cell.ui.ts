/**
 * @file packages/ui/src/site/skins/default/cells/spacer-cell.ui.ts
 * @layer ui/site/skins/default/cells
 *
 * @description
 * Defines the default skin classes for spacer cells.
 */

import type { SiteSpacerUi } from "@compoz/ui/site/site-ui.types";

export const defaultSpacerUi: SiteSpacerUi = {
  root: "w-full shrink-0",
  size: {
    sm: "h-0",

    md: "h-4 md:h-6 lg:h-8",
    lg: "h-6 md:h-10 lg:h-14",
    xl: "h-8 md:h-14 lg:h-20",
  },
} as const;
