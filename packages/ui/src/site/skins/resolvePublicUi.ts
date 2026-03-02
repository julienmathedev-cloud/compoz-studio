/**
 * @file packages/ui/src/site/skins/resolvePublicUi.ts
 * @module ui/public/skins
 */

import { defaultGlobalUi } from "@compoz/ui/site/skins/default/global.ui";
import { lolaGlobalUi } from "@compoz/ui/site/skins/lola/global.ui";

import { mergePublicUi } from "@compoz/ui/lib/mergePublicUi";
import type { PublicGlobalUi } from "@compoz/ui/site/public-ui.types";

export function resolvePublicUi(): PublicGlobalUi {
  return mergePublicUi(defaultGlobalUi, lolaGlobalUi);
}
