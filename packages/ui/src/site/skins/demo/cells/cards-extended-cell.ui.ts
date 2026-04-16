/**
 * @file packages/ui/src/site/skins/demo/cells/cards-extended-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Override UI — cards extended cell (thème Démo).
 */

import type { SiteCardsExtendedUiOverride } from "@compoz/ui/site/site-ui.types";

export const demoCardsExtendedUi: SiteCardsExtendedUiOverride = {
  card: "motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:-translate-y-1 motion-safe:hover:scale-[1.01] motion-safe:hover:shadow-sm motion-safe:hover:border-primary",
} as const;
