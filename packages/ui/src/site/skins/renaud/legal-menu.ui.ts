/**
 * @file packages/ui/src/site/skins/renaud/legal-menu.ui.ts
 * @layer ui/site/skins/renaud
 *
 * @description
 * Defines the Renaud skin overrides for the public site legal menu.
 */

import type { SiteLegalMenuUiOverride } from "@compoz/ui/site/site-ui.types";

export const renaudLegalMenuUi: SiteLegalMenuUiOverride = {
  link: "text-black/85 hover:text-black",
} as const;
