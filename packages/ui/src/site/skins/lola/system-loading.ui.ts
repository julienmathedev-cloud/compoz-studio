/**
 * @file packages/ui/src/site/skins/lola/system-loading.ui.ts
 * @layer ui/public/skins
 *
 * @description
 * Skin UI — loading public (thème Lola).
 */

import type { PublicSystemLoadingUiOverride } from "@compoz/ui/site/public-ui.types";

export const lolaSystemLoadingUi: PublicSystemLoadingUiOverride = {
  spinner: "size-10 text-zinc-500",
} as const;
