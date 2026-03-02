/**
 * @file packages/ui/src/site/skins/lola/blocks/nav-gallery-block.ui.ts
 * @branch main
 * @module ui/public/skins
 *
 * @description
 * Skin UI — preview overview public (thème Lola).
 */

import type { PublicNavGalleryUiOverride } from "@compoz/ui/site/public-ui.types";

export const lolaNavGalleryUi: PublicNavGalleryUiOverride = {
  list: "grid gap-10",
  link: "block w-full h-full rounded-md focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500",
  figure: "relative group w-full aspect-square overflow-hidden rounded-2xl",
  image:
    "absolute inset-0 h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-105 motion-safe:group-hover:[will-change:transform] motion-reduce:transform-none",
  overlayPanel:
    "absolute inset-0 rounded-2xl flex items-end p-4 bg-gradient-to-t from-black/60 to-black/0 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity [@media(hover:none)]:opacity-100 motion-safe:group-hover:[will-change:opacity] motion-reduce:transition-none",
};
