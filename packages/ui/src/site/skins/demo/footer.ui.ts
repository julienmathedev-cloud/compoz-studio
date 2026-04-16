/**
 * @file packages/ui/src/site/skins/demo/footer.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — footer site (thème Démo).
 */

import type { SiteFooterUiOverride } from "@compoz/ui/site/site-ui.types";
import { demoLegalMenuUi } from "@compoz/ui/site/skins/demo/legal-menu.ui";

export const demoFooterUi: SiteFooterUiOverride = {
  legalMenu: demoLegalMenuUi,
};
