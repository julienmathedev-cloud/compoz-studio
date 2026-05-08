/**
 * @file packages/ui/src/site/skins/renaud/header.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Override UI du header pour le thème renaud.
 *
 * @remarks
 * - Renforce l'effet de translucidité/blur du header.
 * - Repose sur les mêmes tokens du thème public.
 */

import type { SiteHeaderUiOverride } from "@compoz/ui/site/site-ui.types";
import { renaudPrimaryMenuUi } from "@compoz/ui/site/skins/renaud/primary-menu.ui";
import { renaudSocialMenuUi } from "@compoz/ui/site/skins/renaud/social-menu.ui";

export const renaudHeaderUi: SiteHeaderUiOverride = {
  header: {
    blur: "supports-[backdrop-filter]:bg-chrome/100 supports-[backdrop-filter]:backdrop-blur-sm text-white",
  },
  siteNameText: "text-current",
  menu: renaudPrimaryMenuUi,
  social: renaudSocialMenuUi,
};
