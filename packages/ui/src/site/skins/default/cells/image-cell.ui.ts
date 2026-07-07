/**
 * @file packages/ui/src/site/skins/default/cells/image-cell.ui.ts
 * @layer ui/site/skins/default/cells
 *
 * @description
 * Defines the default skin classes for image cells.
 */

import type { SiteImageUi } from "@compoz/ui/site/site-ui.types";
import { defaultLightboxUi } from "@compoz/ui/site/skins/default/molecules/lightbox.ui";

export const defaultImageUi: SiteImageUi = {
  root: "flex w-full items-center justify-center",

  figure: "flex flex-col gap-3 items-center",
  caption: "text-sm text-muted-foreground",

  container: "overflow-hidden",

  image: "",

  button:
    "block h-full w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",

  lightbox: defaultLightboxUi,

  imageDefault: "h-auto w-full",
  imageCover: "h-full w-full object-cover",

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
    square: "(max-width: 1024px) 100vw, 1024px",
    portrait: "(max-width: 1024px) 100vw, 1024px",
  },

  size: {
    sm: "w-1/2",
    md: "w-2/3",
    lg: "w-3/4",
    full: "w-full",
  },
} as const;
