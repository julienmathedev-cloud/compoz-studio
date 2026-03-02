/**
 * @file packages/ui/src/site/skins/default/social-menu.ui.ts
 * @module components/public/skins/default
 *
 * @description
 * Style par défaut du menu social.
 */

import type { PublicSocialMenuUi } from "@compoz/ui/site/public-ui.types";

export const defaultSocialMenuUi: PublicSocialMenuUi = {
  list: "m-0 p-0 list-none flex flex-wrap items-center gap-3 md:gap-4",

  item: "shrink-0",

  interactive: "inline-flex",

  // ✅ PRM : transition + hover uniquement si motion autorisé
  link: "inline-flex items-center justify-center rounded-md p-2 motion-safe:transition-opacity motion-safe:duration-200 motion-safe:hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",

  icon: "h-5 w-5",
} as const;
