/**
 * @file packages/ui/src/site/skins/renaud/primary-menu.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — menu principal site (thème renaud).
 */

import type { SitePrimaryMenuUiOverride } from "@compoz/ui/site/site-ui.types";

export const renaudPrimaryMenuUi: SitePrimaryMenuUiOverride = {
  link: "text-current/85 hover:text-current",
} as const;
