/**
 * @file packages/ui/src/site/skins/default/cells/image-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI pour l’image site (thème Default).
 */

import type { SiteImageUi } from "@compoz/ui/site/site-ui.types";

export const defaultImageUi: SiteImageUi = {
  // frame: évite les débordements en cover
  container: "overflow-hidden",

  // base image
  image: "",

  // variante default : rendu naturel responsive
  imageDefault: "h-auto w-full",

  // variantes cover : remplit la frame
  imageCover: "h-full w-full object-cover",

  // figure + caption
  figure: "flex flex-col gap-3",

  caption: "text-muted-foreground text-sm",
} as const;
