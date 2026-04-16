/**
 * @file packages/ui/src/site/skins/lola/blocks/zoom-gallery-block.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — preview overview site (thème Lola).
 */

import type { SiteZoomGalleryUiOverride } from "@compoz/ui/site/site-ui.types";
import { lolaLightboxUi } from "@compoz/ui/site/skins/lola/molecules/lightbox.ui";

export const lolaZoomGalleryUi: SiteZoomGalleryUiOverride = {
  list: "grid gap-4",

  button:
    "rounded-md focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 group block w-full text-left cursor-zoom-in",

  figure: "relative group w-full aspect-square overflow-hidden",

  image:
    "rounded-2xl absolute inset-0 h-full w-full object-contain motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-105 motion-safe:group-hover:[will-change:transform] motion-reduce:transform-none",

  overlayPanel:
    "rounded-2xl absolute inset-0 flex items-end p-4 bg-gradient-to-t from-black/60 to-black/0 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity motion-safe:group-hover:[will-change:opacity] motion-reduce:transition-none",

  overlayContent:
    "not-prose pointer-events-none text-white text-base font-bold leading-tight text-justify",

  lightbox: lolaLightboxUi,
};
