/**
 * @file packages/ui/src/site/skins/renaud/header.ui.ts
 * @layer ui/site/skins/renaud
 *
 * @description
 * Defines the Renaud skin overrides for the public site header.
 */

import type { SiteHeaderUiOverride } from "@compoz/ui/site/site-ui.types";
import { renaudLogoUi } from "@compoz/ui/site/skins/renaud/logo.ui";
import { renaudPrimaryMenuUi } from "@compoz/ui/site/skins/renaud/primary-menu.ui";
import { renaudSocialMenuUi } from "@compoz/ui/site/skins/renaud/social-menu.ui";

export const renaudHeaderUi: SiteHeaderUiOverride = {
  header: {
    base: "border-none",
  },
  logo: renaudLogoUi,
  menu: renaudPrimaryMenuUi,
  social: renaudSocialMenuUi,
};
