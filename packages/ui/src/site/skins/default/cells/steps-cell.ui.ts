/**
 * @file packages/ui/src/site/skins/default/cells/steps-cell.ui.ts
 * @layer ui/site/skins/default/cells
 *
 * @description
 * Defines the default skin classes for steps cells.
 */

import type { SiteStepsUi } from "@compoz/ui/site/site-ui.types";

export const defaultStepsUi: SiteStepsUi = {
  root: "mx-auto w-full",

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

  variants: {
    vertical: {
      root: "max-w-full md:max-w-2xl lg:max-w-3xl",

      list: "flex flex-col items-center gap-1 md:gap-2",

      item: "flex w-full flex-col items-center gap-1 md:gap-2",

      connector: "flex justify-center",

      connectorIcon: "h-8 w-8 text-primary",

      cardRoot: "flex w-full justify-center",
    },

    horizontal: {
      root:
        "max-w-full md:max-w-2xl " +
        "data-[density=default]:lg:max-w-screen-xl " +
        "data-[density=dense]:lg:max-w-3xl data-[density=dense]:xl:max-w-screen-xl",

      list:
        "flex w-full flex-col items-center gap-1 " +
        "data-[density=default]:lg:flex-row data-[density=default]:lg:items-stretch data-[density=default]:lg:justify-center data-[density=default]:lg:gap-1 " +
        "data-[density=dense]:xl:flex-row data-[density=dense]:xl:items-stretch data-[density=dense]:xl:justify-center data-[density=dense]:xl:gap-1",

      item: "contents",

      connector:
        "flex justify-center " +
        "data-[density=default]:lg:w-7 data-[density=default]:lg:shrink-0 data-[density=default]:lg:items-center data-[density=default]:lg:justify-center " +
        "data-[density=dense]:xl:w-7 data-[density=dense]:xl:shrink-0 data-[density=dense]:xl:items-center data-[density=dense]:xl:justify-center",

      connectorIcon:
        "h-8 w-8 text-primary " +
        "data-[density=default]:lg:h-8 data-[density=default]:lg:w-8 data-[density=default]:lg:-rotate-90 " +
        "data-[density=dense]:xl:h-8 data-[density=dense]:xl:w-8 data-[density=dense]:xl:-rotate-90",

      cardRoot:
        "flex w-full justify-center " +
        "data-[density=default]:lg:min-w-0 data-[density=default]:lg:flex-1 data-[density=default]:lg:[&>[data-slot=card]]:w-full data-[density=default]:lg:[&>[data-slot=card]]:min-w-0 data-[density=default]:lg:[&>[data-slot=card]]:max-w-none " +
        "data-[density=dense]:xl:min-w-0 data-[density=dense]:xl:flex-1 data-[density=dense]:xl:[&>[data-slot=card]]:w-full data-[density=dense]:xl:[&>[data-slot=card]]:min-w-0 data-[density=dense]:xl:[&>[data-slot=card]]:max-w-none",
    },
  },
};
