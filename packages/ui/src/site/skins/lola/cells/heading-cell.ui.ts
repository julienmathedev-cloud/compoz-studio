/**
 * @file packages/ui/src/site/skins/lola/cells/heading-cell.ui.ts
 * @layer ui/site/skins/lola/cells
 *
 * @description
 * Defines the Lola skin overrides for heading cells.
 */

import type { SiteHeadingUiOverride } from "@compoz/ui/site/site-ui.types";

export const lolaHeadingUi: SiteHeadingUiOverride = {
  level: {
    h1: "font-medium",
    h2: "font-medium",
    h3: "font-medium",
  },
} as const;
