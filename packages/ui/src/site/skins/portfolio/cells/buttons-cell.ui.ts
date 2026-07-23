/**
 * @file packages/ui/src/site/skins/portfolio/cells/buttons-cell.ui.ts
 * @layer ui/site/skins/portfolio/cells
 *
 * @description
 * Defines the portfolio skin overrides for buttons cells.
 */

import type { SiteButtonsUiOverride } from "@compoz/ui/site/site-ui.types";

export const cardGhostButtonClass = [
  "text-sm font-bold",
  "motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out",
].join(" ");

export const portfolioButtonClass = [
  "min-h-12 rounded-xl px-6 py-3 text-sm font-bold",
  "motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out",

  "data-[variant=default]:border",
  "data-[variant=default]:border-transparent",
  "data-[variant=default]:shadow-sm",
  "data-[variant=default]:motion-safe:hover:translate-y-[-1px]",
  "data-[variant=default]:motion-safe:hover:scale-[1.01]",
  "data-[variant=default]:motion-safe:active:scale-[0.98]",
  "data-[variant=default]:hover:shadow-md",
  "data-[variant=default]:motion-safe:hover:border-primary",

  "data-[variant=outline]:border",
  "data-[variant=outline]:border-transparent",
  "data-[variant=outline]:shadow-sm",
  "data-[variant=outline]:motion-safe:hover:translate-y-[-1px]",
  "data-[variant=outline]:motion-safe:hover:scale-[1.01]",
  "data-[variant=outline]:motion-safe:active:scale-[0.98]",
  "data-[variant=outline]:hover:shadow-md",
  "data-[variant=outline]:motion-safe:hover:border-primary",

  "data-[variant=default]:bg-primary",
  "data-[variant=default]:text-primary-foreground",
  "data-[variant=default]:hover:bg-primary/90",
  "data-[variant=default]:hover:text-primary-foreground",
].join(" ");

export const portfolioButtonsUi: SiteButtonsUiOverride = {
  button: portfolioButtonClass,
} as const;
