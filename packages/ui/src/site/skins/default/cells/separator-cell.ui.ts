/**
 * @file packages/ui/src/site/skins/default/cells/separator-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — separator cell (thème Default).
 */

import type { SiteSeparatorUi } from "@compoz/ui/site/site-ui.types";

export const defaultSeparatorUi: SiteSeparatorUi = {
  root: "w-full",
  align: {
    left: "flex justify-start",
    center: "flex justify-center",
    right: "flex justify-end",
    full: "block",
  },
  size: {
    sm: "w-16",
    md: "w-32",
    lg: "w-48",
  },
  line: "border-border border-t",
} as const;
