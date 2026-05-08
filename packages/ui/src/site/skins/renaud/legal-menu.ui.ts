/**
 * @file packages/ui/src/site/skins/renaud/legal-menu.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — menu légal site (thème renaud).
 */

import type { SiteLegalMenuUiOverride } from "@compoz/ui/site/site-ui.types";

export const renaudLegalMenuUi: SiteLegalMenuUiOverride = {
  link: "text-current/85 hover:text-current",
} as const;
