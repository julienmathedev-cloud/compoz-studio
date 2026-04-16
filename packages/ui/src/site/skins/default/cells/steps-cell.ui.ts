/**
 * @file packages/ui/src/site/skins/default/cells/steps-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — steps cell (thème Default).
 */

import type { SiteStepsUi } from "@compoz/ui/site/site-ui.types";

export const defaultStepsUi: SiteStepsUi = {
  root: "mx-auto w-full max-w-full md:max-w-2xl lg:max-w-3xl",

  list: "flex flex-col gap-1 md:gap-2 items-center",

  connector: "flex justify-center",

  connectorIcon: "h-10 w-10 text-primary",

  card: {
    root: "h-full w-3/4 md:w-2/3 lg:w-5/9 border border-border shadow-xs",

    header: "flex flex-row items-center justify-center",

    headerBalanced: "grid w-full grid-cols-[auto_1fr_auto] items-center gap-3",

    headerBadgeSlot: "flex items-center justify-start",

    headerSpacerSlot: "h-8 w-8 shrink-0",

    content: "flex flex-col gap-2 h-full text-center",

    badge:
      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-base font-bold text-foreground",

    title: "text-center",

    description: "",

    align: {
      left: "items-start text-left",
      center: "items-center text-center",
    },
  },
};
