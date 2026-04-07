/**
 * @file packages/ui/src/site/skins/default/system-loading.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — loading site (thème Default).
 */

import type { SiteSystemLoadingUi } from "@compoz/ui/site/site-ui.types";

export const defaultSystemLoadingUi: SiteSystemLoadingUi = {
  container: "flex min-h-screen items-center justify-center",
  spinner: "size-15",
} as const;
