/**
 * @file packages/ui/src/site/skins/resolveSiteUi.ts
 * @module ui/site/skins
 */

import { defaultGlobalUi } from "@compoz/ui/site/skins/default/global.ui";
import { lolaGlobalUi } from "@compoz/ui/site/skins/lola/global.ui";

import { mergeSiteUi } from "@compoz/ui/lib/mergeSiteUi";
import type { SiteGlobalUi } from "@compoz/ui/site/site-ui.types.ts";

export function resolveSiteUi(): SiteGlobalUi {
  return mergeSiteUi(defaultGlobalUi, lolaGlobalUi);
}
