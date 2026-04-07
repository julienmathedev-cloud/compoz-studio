/**
 * @file packages/ui/src/site/skins/default/blocks/structured-card-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — structured card cell (thème Default).
 */

import type { SiteStructuredCardUi } from "@compoz/ui/site/site-ui.types";

export const defaultStructuredCardUi: SiteStructuredCardUi = {
  root: "",

  grid: "grid gap-6",

  columns: {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
  },

  card: "h-full border border-border ring-0 shadow-border shadow-xs transition-all duration-200 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:shadow-sm hover:border-primary",

  imageWrapper:
    "relative aspect-[16/9] w-2/3 overflow-hidden rounded-md mx-auto",

  image: "h-full w-full object-cover",

  header: "space-y-2 p-4 pb-0",

  title: "text-xl font-semibold",

  caption: "text-sm text-muted-foreground",

  content: "flex flex-col gap-4 p-4 pt-0",

  sections: "flex flex-col gap-3",

  section: "space-y-1",

  sectionTitle:
    "text-sm font-semibold uppercase tracking-wide text-muted-foreground",

  sectionText: "text-sm text-foreground",

  buttonWrapper: "pt-2 flex justify-center",

  button: "",
} as const;
