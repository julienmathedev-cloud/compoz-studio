/**
 * @file packages/ui/src/site/skins/default/cells/image-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI pour l’image site (thème Default).
 */

import type { SiteImageUi } from "@compoz/ui/site/site-ui.types";
import { defaultLightboxUi } from "@compoz/ui/site/skins/default/molecules/lightbox.ui";

export const defaultImageUi: SiteImageUi = {
  // Wrapper global : permet de contrôler la largeur visuelle
  root: "flex w-full items-center justify-center",

  // Figure + caption
  figure: "flex flex-col gap-3 items-center",
  caption: "text-sm text-muted-foreground",

  // Frame : évite les débordements en cover
  container: "overflow-hidden",

  // Base image
  image: "",

  button:
    "block w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",

  lightbox: defaultLightboxUi,

  // Modes de rendu
  imageDefault: "h-auto w-full",
  imageCover: "h-full w-full object-cover",

  // Ratio / comportement visuel
  variantMode: {
    default: "default",
    wide: "cover",
    square: "cover",
    portrait: "cover",
  },

  variantFrame: {
    default: "",
    wide: "aspect-[16/9] w-full",
    square: "aspect-square w-full",
    portrait: "aspect-[4/5] w-full",
  },

  variantSizes: {
    default: "(max-width: 1024px) 100vw, 1024px",
    wide: "(max-width: 1024px) 100vw, 1024px",
    square: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
    portrait: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  },

  // Présence visuelle dans le layout
  size: {
    sm: "w-1/2",
    md: "w-2/3",
    lg: "w-3/4",
    full: "w-full",
  },
} as const;
