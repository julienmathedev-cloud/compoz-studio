/**
 * @file packages/ui/src/site/skins/default/cells/timeline-cell.ui.ts
 * @layer ui/site/skins/default/cells
 *
 * @description
 * Defines the default skin classes for timeline cells.
 */

import type { SiteTimelineUi } from "@compoz/ui/site/site-ui.types";

export const defaultTimelineUi: SiteTimelineUi = {
  root: "relative w-full",

  triggerWrap: "flex justify-center",
  triggerButton: "relative h-12 w-12 cursor-pointer rounded-full",
  triggerIcon:
    "absolute h-10 w-10 motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out",
  triggerIconOpen: "scale-[1] opacity-100",
  triggerIconClosed: "scale-0 opacity-0",

  collapse: "overflow-hidden",

  desktopRailWrap:
    "absolute left-1/2 top-0 z-0 hidden h-full -translate-x-10/19 flex-col items-center md:flex",

  desktopStartDot:
    "h-6 w-6 rounded-full bg-primary motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out",

  desktopLine:
    "origin-top -mb-2 -mt-2 flex-1 w-1.5 bg-primary motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out",

  desktopEndDot:
    "h-6 w-6 rounded-full bg-primary motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out",

  contentWrap: "relative z-10 mx-auto flex max-w-5xl flex-col",

  mobileRailWrap:
    "absolute bottom-0 left-3 top-0 z-0 flex flex-col items-center md:hidden",

  mobileStartDot:
    "h-6 w-6 -mt-2 rounded-full bg-primary motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out",

  mobileLine:
    "origin-top -mb-2 -mt-2 flex-1 w-1.5 bg-primary motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out",

  mobileEndDot:
    "h-6 w-6 rounded-full bg-primary motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out",

  itemsWrap: "relative z-10 flex flex-col",

  item: {
    root: "",

    row: "relative mt-0 flex w-full items-start justify-between md:[margin-top:var(--timeline-item-mt)]",
    rowLeft: "",
    rowRight: "",
    mobileRow: "",

    side: "hidden w-1/2 md:block",

    center:
      "absolute top-10 hidden h-1.5 w-6 bg-primary motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out md:block md:w-12",
    connector: "",
    connectorLeft: "left-1/2 -translate-x-full origin-right",
    connectorRight: "left-1/2 translate-x-0 origin-left",

    contentWrap: "relative w-full pb-4 md:w-1/2",

    cardWrap: "mt-5 flex items-start gap-4 rounded-md",
    cardWrapLeft: "md:mr-10 md:flex-row-reverse",
    cardWrapRight: "md:ml-10 md:flex-row",

    badgeWrap: "shrink-0",
    badge:
      "flex h-12 w-12 items-center justify-center rounded-md bg-primary font-bold text-primary-foreground motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out",

    card: "relative z-20 motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out",
    cardLeft: "md:mr-6",
    cardRight: "md:ml-6",

    cardInner: "",
    textLeft: "text-left md:text-right",
    textRight: "text-left md:text-left",
    textBlock: "space-y-2",

    period:
      "text-xl font-bold text-primary motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out",
    title:
      "text-base font-semibold text-foreground motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out",
    subtitle:
      "text-sm font-semibold text-muted-foreground motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out",
    description:
      "text-sm leading-relaxed text-muted-foreground motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out",

    keywordsWrap: "flex flex-wrap gap-2 pt-2",
    keywordsWrapLeft: "md:justify-end",
    keywordsWrapRight: "md:justify-start",
    keyword: "",
  },
} as const;
