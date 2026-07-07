/**
 * @file packages/ui/src/site/skins/demo/footer.ui.ts
 * @layer ui/site/skins/demo
 *
 * @description
 * Defines the demo skin overrides for the public site footer.
 */

import type { SiteFooterUiOverride } from "@compoz/ui/site/site-ui.types";
import { demoLegalMenuUi } from "@compoz/ui/site/skins/demo/legal-menu.ui";

export const demoFooterUi: SiteFooterUiOverride = {
  legalMenu: demoLegalMenuUi,
};
