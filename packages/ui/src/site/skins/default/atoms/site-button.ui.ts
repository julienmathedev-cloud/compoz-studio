/**
 * @file packages/ui/src/site/skins/default/atoms/site-button.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — bouton public partagé (thème Default).
 */

import type { SiteButtonUi } from "@compoz/ui/site/site-ui.types";

export const defaultSiteButtonUi: SiteButtonUi = {
  content: "inline-flex items-center gap-2",
  label: "",
  icon: "h-4 w-4",
} as const;
