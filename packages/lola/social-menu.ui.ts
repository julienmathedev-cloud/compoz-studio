/**
 * @file packages/ui/src/site/skins/lola/social-menu.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — menu social site (thème Lola).
 *
 * @remarks
 * - Fournit uniquement des classes Tailwind (aucune logique).
 * - Consommé par `SiteSocialMenu` via la prop `ui`.
 */

import type { SiteSocialMenuUiOverride } from "@compoz/ui/site/site-ui.types";

export const lolaSocialMenuUi: SiteSocialMenuUiOverride = {
  /** Classes appliquées par le skin/template (container). */
  list: "m-0 p-0 list-none flex flex-wrap items-center gap-4 md:gap-7 lg:gap-10",

  /** Classes appliquées par le skin/template (zone interactive). */
  interactive:
    "inline-flex motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-105 motion-safe:active:scale-95 hover:opacity-80",

  /** Classes appliquées par le skin/template (lien). */
  link: "rounded-md focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500",

  /** Classes appliquées par le skin/template (icône). */
  icon: "h-5 w-5", // 24px
} as const;
