/**
 * @file packages/ui/src/site/skins/demo/cells/extended-card-cell.ui.ts
 * @layer ui/site/skins/demo/cells
 *
 * @description
 * Defines the demo skin overrides for extended card cells.
 */

import type { SiteExtendedCardUiOverride } from "@compoz/ui/site/site-ui.types";

export const demoExtendedCardUi: SiteExtendedCardUiOverride = {
  card: "motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:-translate-y-1 motion-safe:hover:scale-[1.01] motion-safe:hover:shadow-sm motion-safe:hover:border-primary",
} as const;
