/**
 * @file packages/ui/src/site/skins/demo/cells/timeline-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Override UI — timeline cell (thème Démo).
 */

import type { SiteTimelineUiOverride } from "@compoz/ui/site/site-ui.types";

export const demoTimelineUi: SiteTimelineUiOverride = {
  item: {
    center: "shadow-lg shadow-primary/30",
    badge: "shadow-md shadow-primary/30",
    card: "motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:-translate-y-1 motion-safe:hover:scale-[1.02]",
  },
} as const;
