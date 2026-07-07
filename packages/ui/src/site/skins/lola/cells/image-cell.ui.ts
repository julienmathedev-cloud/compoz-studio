/**
 * @file packages/ui/src/site/skins/lola/cells/image-cell.ui.ts
 * @layer ui/site/skins/lola/cells
 *
 * @description
 * Defines the Lola skin overrides for image cells.
 */

import type { SiteImageUiOverride } from "@compoz/ui/site/site-ui.types";
import { lolaLightboxUi } from "@compoz/ui/site/skins/lola/molecules/lightbox.ui";

export const lolaImageUi: SiteImageUiOverride = {
  container: "rounded-xl",
  lightbox: lolaLightboxUi,
};
