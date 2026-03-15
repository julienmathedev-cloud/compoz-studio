/**
 * @file packages/ui/src/site/skins/default/blocks/case-study-card-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — case study card cell (thème Default).
 */

import type { SiteCaseStudyCardUi } from "@compoz/ui/site/site-ui.types";

export const defaultCaseStudyCardUi: SiteCaseStudyCardUi = {
  root: "",

  grid: "grid gap-6",

  columns: {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
  },

  card: "h-full rounded-lg border bg-card p-6 shadow-sm",

  mediaWrap: "overflow-hidden rounded-t-lg",

  image: "w-full h-full object-cover",

  header: "space-y-2",

  title: "text-xl font-semibold",

  caption: "text-sm text-muted-foreground",

  content: "space-y-6",

  section: "space-y-1",

  sectionTitle:
    "text-sm font-semibold uppercase tracking-wide text-muted-foreground",

  sectionText: "text-sm text-foreground",

  labels: {
    context: "Contexte",
    solution: "Solution",
    result: "Résultat",
  },
} as const;
