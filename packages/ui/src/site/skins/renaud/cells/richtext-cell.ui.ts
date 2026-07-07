/**
 * @file packages/ui/src/site/skins/renaud/cells/richtext-cell.ui.ts
 * @layer ui/site/skins/renaud/cells
 *
 * @description
 * Defines the Renaud skin overrides for rich text cells.
 */
import type { SiteRichTextUiOverride } from "@compoz/ui/site/site-ui.types";

export const renaudRichTextUi: SiteRichTextUiOverride = {
  root: [
    "text-base",

    "[&_ul[data-list-variant=check]>li]:before:text-primary",
    "[&_ul[data-list-variant=arrow]>li]:before:text-primary",
    "[&_ul[data-list-variant=check]>li]:pl-8",
    "[&_ul[data-list-variant=arrow]>li]:pl-10",
    "[&_ul[data-list-variant=check]>li]:before:-top-2",
    "[&_ul[data-list-variant=arrow]>li]:before:-top-2",
    "[&_ul[data-list-variant=check]>li]:before:text-[1.6em]",
    "[&_ul[data-list-variant=arrow]>li]:before:text-[1.6em]",
    "[&_ul[data-list-variant=check]>li]:before:font-bold",
    "[&_ul[data-list-variant=arrow]>li]:before:font-bold",
  ].join(" "),
} as const;
