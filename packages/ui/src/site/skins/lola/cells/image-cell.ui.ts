/**
 * @file packages/ui/src/site/skins/lola/cells/image-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — image cell (site lola).
 */

import type { SiteImageUiOverride } from "@compoz/ui/site/site-ui.types";
import { lolaLightboxUi } from "@compoz/ui/site/skins/lola/molecules/lightbox.ui";

export const lolaImageUi: SiteImageUiOverride = {
  container: "rounded-xl",
  lightbox: lolaLightboxUi,
};
