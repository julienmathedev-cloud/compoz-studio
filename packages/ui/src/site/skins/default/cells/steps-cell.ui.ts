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

  connectorIcon: "h-10 w-10 text-primary ",

  card: {
    root: "h-full border border-border ring-0 w-3/4 md:w-2/3 lg:w-1/2 shadow-border shadow-xs transition-all duration-200 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:shadow-sm hover:border-primary",

    header: "flex flex-row items-center! justify-center gap-2",

    content: "flex flex-col gap-2 h-full text-center",

    badge:
      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary text-base font-bold bg-primary text-primary-foreground",

    title: "",

    description: "",

    align: {
      left: "items-start text-left",
      center: "items-center text-center",
    },
  },
};
