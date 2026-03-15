/**
 * @file packages/ui/src/site/skins/default/cells/steps-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — steps cell (thème Default).
 */

import type { SiteStepsUi } from "@compoz/ui/site/site-ui.types";

export const defaultStepsUi: SiteStepsUi = {
  root: "w-full",
  list: "grid gap-6",

  card: {
    root: "h-full",
    header: "flex flex-col gap-3",
    content: "",
    badge:
      "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold",
    title: "",
    description: "text-muted-foreground",

    align: {
      left: "items-start text-left",
      center: "items-center text-center",
    },
  },
};
