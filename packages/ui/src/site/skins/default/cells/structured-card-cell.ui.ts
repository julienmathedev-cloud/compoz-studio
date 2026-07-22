/**
 * @file packages/ui/src/site/skins/default/cells/structured-card-cell.ui.ts
 * @layer ui/site/skins/default/cells
 *
 * @description
 * Defines the default skin classes for structured card cells.
 */

import type { SiteStructuredCardUi } from "@compoz/ui/site/site-ui.types";
import { defaultSiteButtonUi } from "@compoz/ui/site/skins/default/atoms/site-button.ui";

export const defaultStructuredCardUi: SiteStructuredCardUi = {
  root: "h-full",

  grid: "grid gap-6",

  columns: {
    1: "grid-cols-1 md:grid-cols-2 md:[&>*:only-child]:col-span-2 md:[&>*:only-child]:mx-auto md:[&>*:only-child]:w-1/2",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
  },

  card: "h-full border border-border shadow-xs",

  imageWrapper:
    "relative mx-auto aspect-[16/9] w-2/3 overflow-hidden rounded-md",

  image: "h-full w-full object-cover",

  header: "space-y-2 p-4 pb-0",

  title: "text-xl font-semibold",

  caption: "text-sm text-muted-foreground",

  content: "h-full gap-4 p-4 pt-0 flex-1",

  sections: "flex flex-col gap-3",

  section: "space-y-1",

  sectionTitle:
    "text-sm font-semibold uppercase tracking-wide text-muted-foreground",

  sectionText: "text-sm text-foreground text-justify",

  buttonWrapper: "pt-2 flex justify-center mt-auto",

  button: "",

  buttonUi: defaultSiteButtonUi,
} as const;
