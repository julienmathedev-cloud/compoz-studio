/**
 * @file packages/ui/src/site/skins/portfolio/cells/richtext-cell.ui.ts
 * @layer ui/site/skins/portfolio/cells
 *
 * @description
 * Defines the portfolio skin overrides for rich text cells.
 */

import type { SiteRichTextUiOverride } from "@compoz/ui/site/site-ui.types";

export const portfolioRichTextUi: SiteRichTextUiOverride = {
  root: [
    "[&_ul[data-list-variant=check]>li]:before:text-primary",
    "[&_ul[data-list-variant=arrow]>li]:before:text-primary",
    "[&_ul[data-list-variant=cross]>li]:before:text-primary",
    "[&_ul[data-list-variant=check]>li]:pl-8",
    "[&_ul[data-list-variant=arrow]>li]:pl-10",
    "[&_ul[data-list-variant=cross]>li]:pl-8",
    "[&_ul[data-list-variant=check]>li]:before:-top-2",
    "[&_ul[data-list-variant=arrow]>li]:before:-top-2",
    "[&_ul[data-list-variant=cross]>li]:before:-top-2",
    "[&_ul[data-list-variant=check]>li]:before:text-[1.6em]",
    "[&_ul[data-list-variant=arrow]>li]:before:text-[1.6em]",
    "[&_ul[data-list-variant=cross]>li]:before:text-[1.6em]",
    "[&_ul[data-list-variant=check]>li]:before:font-bold",
    "[&_ul[data-list-variant=arrow]>li]:before:font-bold",
    "[&_ul[data-list-variant=cross]>li]:before:font-bold",
  ].join(" "),
} as const;
