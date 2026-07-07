/**
 * @file packages/ui/src/site/skins/renaud/primary-menu.ui.ts
 * @layer ui/site/skins/renaud
 *
 * @description
 * Defines the Renaud skin overrides for the public site primary menu.
 */

import type { SitePrimaryMenuUiOverride } from "@compoz/ui/site/site-ui.types";

export const renaudPrimaryMenuUi: SitePrimaryMenuUiOverride = {
  link: "text-current/85 hover:text-current",
} as const;
