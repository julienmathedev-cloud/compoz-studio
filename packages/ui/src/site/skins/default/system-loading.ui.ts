/**
 * @file packages/ui/src/site/skins/default/system-loading.ui.ts
 * @layer ui/public/skins
 *
 * @description
 * Skin UI — loading public (thème Default).
 */

import type { PublicSystemLoadingUi } from "@compoz/ui/site/public-ui.types";

export const defaultSystemLoadingUi: PublicSystemLoadingUi = {
  container: "flex flex-1 items-center justify-center",
  spinner: "size-10 text-muted-foreground",
} as const;
