/**
 * @file packages/ui/src/site/skins/default/cells/card-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — cards cell (thème Default).
 */

import type { SiteCardUi } from "@compoz/ui/site/site-ui.types";

export const defaultCardUi: SiteCardUi = {
  root: "w-full",

  grid: "grid gap-6",

  columns: {
    2: "md:grid-cols-2",
    3: "md:grid-cols-2 lg:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  },

  align: {
    left: "items-start text-left",
    center: "items-center text-center",
  },

  card: "h-full border border-border shadow-xs",

  header: "flex flex-col",

  headerTop: "flex items-center! gap-5",

  iconContainer: "",

  icon: "h-7 w-7 shrink-0 text-primary",

  title: "",

  content: "h-full",

  description: "text-muted-foreground",
} as const;
