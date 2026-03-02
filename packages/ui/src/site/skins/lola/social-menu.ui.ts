/**
 * @file packages/ui/src/site/skins/lola/social-menu.ui.ts
 * @layer ui/public/skins
 *
 * @description
 * Skin UI — menu social public (thème Lola).
 *
 * @remarks
 * - Fournit uniquement des classes Tailwind (aucune logique).
 * - Consommé par `PublicSocialMenu` via la prop `ui`.
 */

import type { PublicSocialMenuUiOverride } from "@compoz/ui/site/public-ui.types";

export const lolaSocialMenuUi: PublicSocialMenuUiOverride = {
  /** Classes appliquées par le skin/template (container). */
  list: "m-0 p-0 list-none flex flex-wrap items-center gap-4 md:gap-7 lg:gap-10",

  // Classes appliquées par le skin/template (lien).
  interactive:
    "inline-flex motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-105 motion-safe:active:scale-95 hover:opacity-80",
  link: "rounded-md focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500",
  /** Classes appliquées par le skin/template (icône). */
  icon: "h-5 w-5", // 24px
} as const;
