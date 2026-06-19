/**
 * @file packages/ui/src/site/skins/renaud/cells/card-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — cards cell (thème Renaud).
 */

import type { SiteCardUiOverride } from "@compoz/ui/site/site-ui.types";

export const renaudCardUi: SiteCardUiOverride = {
  title: "font-bold",
  card: "motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:-translate-y-1 motion-safe:hover:scale-[1.01] motion-safe:hover:shadow-sm motion-safe:hover:border-primary",
  iconContainer:
    "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/8",
} as const;
