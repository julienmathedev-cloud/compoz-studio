/**
 * @file packages/ui/src/site/skins/demo/cells/zoom-gallery-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Override UI — zoom gallery cell (thème Démo).
 */

import type { SiteZoomGalleryUiOverride } from "@compoz/ui/site/site-ui.types";
import { demoLightboxUi } from "@compoz/ui/site/skins/demo/molecules/lightbox.ui";

export const demoZoomGalleryUi: SiteZoomGalleryUiOverride = {
  image:
    "motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-safe:group-hover:scale-[1.02]",

  overlayPanel:
    "bg-gradient-to-t from-popover/60 to-popover/0 [@media(hover:none)]:opacity-100 motion-safe:group-hover:[will-change:opacity] motion-reduce:transition-none",

  overlayContent: "text-popover-foreground text-2xl font-bold",

  lightbox: demoLightboxUi,
} as const;
