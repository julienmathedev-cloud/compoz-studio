/**
 * @file packages/ui/src/site/skins/default/cells/card-cell.ui.ts
 * @layer ui/site/skins/default/cells
 *
 * @description
 * Defines the default skin classes for card cells.
 */

import type { SiteCardUi } from "@compoz/ui/site/site-ui.types";
import { defaultSiteButtonUi } from "@compoz/ui/site/skins/default/atoms/site-button.ui";

export const defaultCardUi: SiteCardUi = {
  root: "h-full w-full",

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

  eyebrow:
    "text-sm font-semibold uppercase tracking-wide text-muted-foreground",

  title: "",

  content: "flex flex-1 flex-col",

  description: "text-muted-foreground",

  buttonWrapper: "mt-auto pt-4",

  button: "",

  buttonUi: defaultSiteButtonUi,
} as const;
