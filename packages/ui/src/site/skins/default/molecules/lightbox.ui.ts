/**
 * @file packages/ui/src/site/skins/default/molecules/lightbox.ui.ts
 * @layer ui/site/skins/default/molecules
 *
 * @description
 * Defines the default skin classes for the site lightbox.
 */

import type { SiteLightboxUi } from "@compoz/ui/site/site-ui.types";

export const defaultLightboxUi: SiteLightboxUi = {
  overlay:
    "fixed inset-0 z-[100] grid place-items-center bg-black/50 backdrop-blur-sm",

  panel:
    "relative grid w-[min(92vw,1100px)] max-h-[92vh] gap-4 rounded-md bg-popover p-3 pt-12 transform-gpu will-change-transform will-change-opacity md:gap-6 md:p-4 lg:gap-8 lg:p-6",

  panelEnter: "lb-zoom-in motion-reduce:transition-none",
  panelExit: "lb-zoom-out motion-reduce:transition-none",
  panelFrom:
    "opacity-0 scale-[0.98] motion-reduce:opacity-100 motion-reduce:scale-100",

  closeButton:
    "absolute top-2 right-2 z-20 inline-flex cursor-pointer select-none items-center justify-center",

  closeIcon: "size-4 pointer-events-none md:size-5 lg:size-6",

  imageWrap: "relative w-full min-h-[60vh]",
  image: "absolute inset-0 z-0 object-contain",

  caption:
    "pointer-events-none text-center text-sm font-medium leading-tight text-popover-foreground md:text-base",
} as const;
