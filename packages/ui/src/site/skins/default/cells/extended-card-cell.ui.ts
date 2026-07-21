/**
 * @file packages/ui/src/site/skins/default/cells/extended-card-cell.ui.ts
 * @layer ui/site/skins/default/cells
 *
 * @description
 * Defines the default skin classes for extended card cells.
 */

import type { SiteExtendedCardUi } from "@compoz/ui/site/site-ui.types";
import { defaultSiteButtonUi } from "@compoz/ui/site/skins/default/atoms/site-button.ui";

export const defaultExtendedCardUi: SiteExtendedCardUi = {
  root: "h-full w-full",

  grid: "grid gap-6",

  columns: {
    1: "grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-2 lg:grid-cols-3",
  },

  align: {
    left: "items-start text-left",
    center: "items-center text-center",
  },

  card: "h-full border border-border shadow-xs",

  header: "flex flex-col",

  headerTop: "flex items-center! gap-5",

  icon: "h-7 w-7 shrink-0 text-primary",

  eyebrow:
    "text-sm font-semibold uppercase tracking-wide text-muted-foreground",

  title: "",

  content: "flex flex-1 flex-col gap-3",

  description: "text-muted-foreground",

  bulletsList: "flex flex-col gap-1",

  bulletsAlign: {
    left: "items-start",
    center: "items-center",
  },

  footer: "text-sm text-muted-foreground",

  footerAlign: {
    left: "",
    center: "justify-center text-center",
  },

  buttonWrapper: "ml-auto",

  button: "",

  buttonUi: defaultSiteButtonUi,
} as const;
