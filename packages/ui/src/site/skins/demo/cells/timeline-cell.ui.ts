/**
 * @file packages/ui/src/site/skins/demo/cells/timeline-cell.ui.ts
 * @layer ui/site/skins/demo/cells
 *
 * @description
 * Defines the demo skin overrides for timeline cells.
 */

import type { SiteTimelineUiOverride } from "@compoz/ui/site/site-ui.types";

export const demoTimelineUi: SiteTimelineUiOverride = {
  item: {
    center: "shadow-lg shadow-primary/30",
    badge: "shadow-md shadow-primary/30",
    card: "motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:-translate-y-1 motion-safe:hover:scale-[1.02]",
    keyword:
      "inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent bg-primary px-2 py-0.5 text-xs font-medium whitespace-nowrap text-primary-foreground motion-safe:transition-all hover:bg-primary/80",
  },
} as const;
