/**
 * @file packages/ui/src/site/skins/default/cells/buttons-cell.ui.ts
 * @layer ui/site/skins/default/cells
 *
 * @description
 * Defines the default skin classes for buttons cells.
 */

import type { SiteButtonsUi } from "@compoz/ui/site/site-ui.types";
import { defaultSiteButtonUi } from "@compoz/ui/site/skins/default/atoms/site-button.ui";

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
    md: "gap-2 md:gap-4 lg:gap-6",
    lg: "gap-2 md:gap-6 lg:gap-12",
  },
  button: "",
  buttonUi: defaultSiteButtonUi,
} as const;
