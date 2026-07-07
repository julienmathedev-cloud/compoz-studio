/**
 * @file packages/ui/src/site/skins/portfolio/cells/structured-card-cell.ui.ts
 * @layer ui/site/skins/portfolio/cells
 *
 * @description
 * Defines the portfolio skin overrides for structured card cells.
 */

import type { SiteStructuredCardUiOverride } from "@compoz/ui/site/site-ui.types";
import { portfolioButtonClass } from "@compoz/ui/site/skins/portfolio/cells/buttons-cell.ui";

export const portfolioStructuredCardUi: SiteStructuredCardUiOverride = {
  columns: {
    1: "grid-cols-1 md:grid-cols-2 md:[&>*:only-child]:col-span-2 md:[&>*:only-child]:mx-auto md:[&>*:only-child]:w-full",
  },

  card: "border-border/80 bg-card/70 shadow-xs motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out motion-safe:hover:-translate-y-1 motion-safe:hover:scale-[1.01] motion-safe:hover:shadow-sm motion-safe:hover:border-primary/40 motion-safe:hover:bg-primary/2",

  header: "space-y-2 p-2 pb-0 pt-0 md:p-6 md:pb-0 md:pt-0",

  title:
    "max-w-3xl text-xl font-black leading-tight tracking-[-0.04em] text-foreground md:text-2xl",

  caption:
    "max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base",

  content: "flex flex-1 flex-col gap-4 p-2 pt-0 md:p-6 md:pt-2 pb-0 md:pb-0",

  sections: "flex flex-col gap-4",

  section: "space-y-1.5",

  sectionTitle:
    "text-xs font-extrabold uppercase tracking-wide text-muted-foreground md:text-sm",

  sectionText: "text-sm leading-relaxed text-foreground",

  buttonWrapper: "mt-auto flex justify-center pt-3 pb-0",

  button: portfolioButtonClass,
} as const;
