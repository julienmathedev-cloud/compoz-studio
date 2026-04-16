/**
 * @file packages/ui/src/site/skins/lola/system-loading.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — loading site (thème Lola).
 */

import type { SiteSystemLoadingUiOverride } from "@compoz/ui/site/site-ui.types";

export const lolaSystemLoadingUi: SiteSystemLoadingUiOverride = {
  spinner: "size-10 text-zinc-500",
} as const;
