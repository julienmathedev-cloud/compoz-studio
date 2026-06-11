/**
 * @file packages/ui/src/site/skins/portfolio/cells/timeline-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — timeline cell (thème Portfolio).
 */

import type { SiteTimelineUiOverride } from "@compoz/ui/site/site-ui.types";
import { portfolioButtonClass } from "@compoz/ui/site/skins/portfolio/cells/buttons-cell.ui";

export const portfolioTimelineUi: SiteTimelineUiOverride = {
  triggerButton:
    portfolioButtonClass + " relative h-12 w-12 cursor-pointer rounded-full",

  desktopRailWrap:
    "absolute bottom-0 top-0 z-0 hidden flex-col items-center md:!left-3 md:!flex md:!h-auto md:!translate-x-0",

  desktopStartDot:
    "h-5 w-5 -mt-1 rounded-full bg-primary motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out",

  desktopLine:
    "origin-top -mb-1.5 -mt-1.5 w-1 bg-primary motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out",

  desktopEndDot:
    "h-5 w-5 rounded-full bg-primary motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out",

  contentWrap: "relative z-10 flex flex-col md:!mx-0 md:!w-full md:!max-w-none",

  itemsWrap: "relative z-10 flex flex-col gap-3 md:gap-5 lg:gap-8",

  item: {
    row: "relative mt-0 flex w-full items-start justify-between md:![margin-top:0]",

    side: "hidden w-0 md:!hidden md:!w-0",

    center: "hidden md:!hidden",
    connector: "hidden md:!hidden",
    connectorLeft: "hidden md:!hidden",
    connectorRight: "hidden md:!hidden",

    contentWrap: "relative w-full min-w-0 pb-4 md:!w-full",

    cardWrap: "mt-5 flex min-w-0 items-start gap-4 rounded-md",
    cardWrapLeft: "md:!mr-0 md:!flex-row",
    cardWrapRight: "md:!ml-0 md:!flex-row",

    badgeWrap: "shrink-0",

    badge:
      "flex h-10 w-10 ml-0.5 items-center justify-center rounded-lg bg-primary px-1 text-center text-xs font-black leading-tight text-primary-foreground shadow-sm motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out",

    card: "relative z-20 min-w-0 flex-1 motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out",
    cardLeft: "md:!mr-0",
    cardRight: "md:!ml-0",

    cardInner: "min-w-0",

    textLeft: "text-left md:!text-left",
    textRight: "text-left md:!text-left",

    period:
      "text-lg font-black tracking-[-0.035em] text-primary motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out md:text-xl",

    textBlock:
      "space-y-2 md:grid md:grid-cols-[minmax(26rem,1fr)_minmax(0,16rem)] md:items-start md:gap-x-24 md:space-y-0 lg:grid-cols-[minmax(0,34rem)_minmax(14rem,22rem)] lg:gap-x-38 xl:grid-cols-[minmax(0,36rem)_minmax(15rem,24rem)] xl:gap-x-42",

    title:
      "text-base font-black leading-snug tracking-[-0.03em] text-foreground motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out md:col-start-1 lg:max-w-[34rem] xl:max-w-[36rem]",

    subtitle:
      "text-sm font-bold leading-relaxed text-muted-foreground motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out md:col-start-1 md:mt-2 lg:max-w-[34rem] xl:max-w-[36rem]",

    description:
      "text-sm leading-relaxed text-muted-foreground motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out md:col-start-1 md:mt-2 lg:max-w-[34rem] xl:max-w-[36rem]",

    keywordsWrap:
      "ml-auto flex w-full max-w-full justify-end gap-2 pt-2 pr-1 md:col-start-2 md:row-start-2 md:row-span-3 md:ml-0 md:flex md:max-w-none md:justify-start md:pl-6 md:pr-0 md:pt-15 lg:pl-0",

    keywordsWrapLeft: "md:!justify-start",
    keywordsWrapRight: "md:!justify-start",

    keyword:
      "portfolio-timeline-note block max-w-[min(100%,24rem)] whitespace-normal break-words bg-transparent px-0 py-0 text-right text-[0.9rem] font-semibold italic leading-relaxed text-muted-foreground md:relative md:block md:w-full md:min-w-0 md:max-w-none md:text-left md:text-[0.95rem] md:font-semibold md:italic md:leading-relaxed md:text-muted-foreground lg:text-[1.1rem]",
  },
} as const;
