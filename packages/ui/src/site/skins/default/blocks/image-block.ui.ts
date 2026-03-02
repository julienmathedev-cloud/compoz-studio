/**
 * @file packages/ui/src/site/skins/default/blocks/image-block.ui.ts
 * @layer ui/public/skins
 *
 * @description
 * Skin UI pour l’image public (thème Default).
 */

import type { PublicImageUi } from "@compoz/ui/site/public-ui.types";

export const defaultImageUi: PublicImageUi = {
  // frame: évite les débordements en cover
  container: "overflow-hidden",

  // base image
  image: "",

  // variante default : rendu naturel responsive
  imageDefault: "h-auto w-full",

  // variantes cover : remplit la frame
  imageCover: "h-full w-full object-cover",
} as const;
