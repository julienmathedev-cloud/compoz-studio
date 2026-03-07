/**
 * @file packages/ui/src/site/skins/default/blocks/image-block.ui.ts
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
} as const;
