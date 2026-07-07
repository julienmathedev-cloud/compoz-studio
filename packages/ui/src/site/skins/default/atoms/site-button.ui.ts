/**
 * @file packages/ui/src/site/skins/default/atoms/site-button.ui.ts
 * @layer ui/site/skins/default/atoms
 *
 * @description
 * Defines the default skin classes for shared public site buttons.
 */

import type { SiteButtonUi } from "@compoz/ui/site/site-ui.types";

export const defaultSiteButtonUi: SiteButtonUi = {
  content: "inline-flex items-center gap-2",
  label: "",
  icon: "h-4 w-4",
} as const;
