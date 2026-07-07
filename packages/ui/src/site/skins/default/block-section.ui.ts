/**
 * @file packages/ui/src/site/skins/default/block-section.ui.ts
 * @layer ui/site/skins/default
 *
 * @description
 * Defines the default skin classes for public site block sections.
 */

import type { SiteBlockSectionUi } from "@compoz/ui/site/site-ui.types";

export const defaultBlockSectionUi: SiteBlockSectionUi = {
  surface: "bg-background",
  containerContained: "w-full mx-auto max-w-screen-xl px-3 md:px-4 lg:px-6",
  containerFullBleed: "h-full w-full",

  sectionSpacingContained: "py-6 md:py-12 lg:py-18",

  rows: "space-y-6 md:space-y-8",

  grid: "grid",

  gridCols: {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2 gap-6",
    3: "grid-cols-1 md:grid-cols-3 gap-3 md:gap-4",
  },

  column: "flex min-w-0 flex-col gap-3 md:gap-4",

  cell: "min-w-0",
} as const;
