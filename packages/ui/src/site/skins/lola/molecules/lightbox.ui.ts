/**
 * @file packages/ui/src/site/skins/lola/molecules/lightbox.ui.ts
 * @layer ui/public/skins
 *
 * @description
 * Skin UI — lightbox public (thème Lola).
 */

import type { PublicLightboxUiOverride } from "@compoz/ui/site/public-ui.types";

export const lolaLightboxUi: PublicLightboxUiOverride = {
  overlay:
    "fixed inset-0 z-[100] grid items-center justify-center bg-black/70 backdrop-blur-sm",

  panel:
    "relative w-[min(92vw,1100px)] max-h-[92vh] bg-black/20 rounded-md grid gap-4 md:gap-6 lg:gap-8 p-3 pt-12 md:p-4 lg:p-6 transform-gpu will-change-transform will-change-opacity",

  // ✅ PRM: animations uniquement en motion-safe
  panelEnter: "lb-zoom-in motion-reduce:transition-none",
  panelExit: "lb-zoom-out motion-reduce:transition-none",

  // ✅ Optionnel mais safe: pas de “zoom” en reduced motion
  panelFrom:
    "opacity-0 scale-[0.10] motion-reduce:opacity-100 motion-reduce:scale-100",

  // ✅ cleanup doublons
  closeButton:
    "absolute top-2 right-2 z-20 inline-flex items-center justify-center rounded-md bg-white/90 p-2 shadow hover:bg-white cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500",

  closeIcon: "size-4 md:size-5 lg:size-6 pointer-events-none",
  imageWrap: "relative w-full min-h-[60vh]",
  image: "absolute inset-0 object-contain z-0",
  caption:
    "pointer-events-none text-sm md:text-base font-bold leading-tight text-white text-center",
};
