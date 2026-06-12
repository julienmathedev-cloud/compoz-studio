/**
 * @file packages/ui/src/site/skins/lola/cells/heading-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Override UI — heading cell (site lola).
 *
 * @remarks
 * - Définit uniquement les styles Tailwind.
 */

import type { SiteHeadingUiOverride } from "@compoz/ui/site/site-ui.types";

export const lolaHeadingUi: SiteHeadingUiOverride = {
  level: {
    h1: "font-medium",
    h2: "font-medium",
    h3: "font-medium",
  },
} as const;
