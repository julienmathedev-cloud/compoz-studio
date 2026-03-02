/**
 * @file packages/ui/src/site/skins/default/logo.ui.ts
 * @module components/public/skins/default
 *
 * @description
 * Style par défaut du logo.
 */

import type { PublicLogoUi } from "@compoz/ui/site/public-ui.types";

export const defaultLogoUi: PublicLogoUi = {
  // Focus ring cohérent + target propre.
  link: "inline-flex rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",

  // Neutre, responsive, anti-accident (sélection).
  image: "h-10 w-auto md:h-12 lg:h-14 select-none",
} as const;
