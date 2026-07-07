/**
 * @file packages/ui/src/site/skins/demo/primary-menu.ui.ts
 * @layer ui/site/skins/demo
 *
 * @description
 * Defines the demo skin overrides for the public site primary menu.
 */

import type { SitePrimaryMenuUiOverride } from "@compoz/ui/site/site-ui.types";

export const demoPrimaryMenuUi: SitePrimaryMenuUiOverride = {
  interactive:
    "motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98]",
} as const;
