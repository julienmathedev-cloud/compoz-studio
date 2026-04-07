/**
 * @file packages/ui/src/site/skins/default/logo.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — logo site (thème Default).
 */

import type { SiteLogoUi } from "@compoz/ui/site/site-ui.types";

export const defaultLogoUi: SiteLogoUi = {
  // Focus ring cohérent + target propre.
  link: "inline-flex cursor-pointer motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:opacity-90 motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",

  // Neutre, responsive, anti-accident (sélection).
  image: "h-10 w-auto md:h-12 lg:h-14 select-none cursor-pointer",

  // Largeur rendue approximative pour aider next/image.
  sizes: "(max-width: 768px) 160px, 220px",
} as const;
