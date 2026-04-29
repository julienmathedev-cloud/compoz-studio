/**
 * @file packages/ui/src/site/skins/default/cells/buttons-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — buttons cell (thème Default).
 */

import type { SiteButtonsUi } from "@compoz/ui/site/site-ui.types";

export const defaultButtonsUi: SiteButtonsUi = {
  root: "w-full",
  list: "flex flex-wrap items-center",
  align: {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  },
  gap: {
    sm: "gap-2",
    md: "gap-2 sm:gap-6",
    lg: "gap-2 sm:gap-12",
  },
  button: "",
} as const;
