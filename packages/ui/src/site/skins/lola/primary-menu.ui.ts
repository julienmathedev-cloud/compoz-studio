/**
 * @file packages/ui/src/site/skins/lola/primary-menu.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — menu principal site (thème Lola).
 *
 * @remarks
 * - Fournit uniquement des classes Tailwind (aucune logique).
 * - Consommé par `SitePrimaryMenu` via la prop `ui`.
 */

import type { SitePrimaryMenuUiOverride } from "@compoz/ui/site/site-ui.types";

export const lolaPrimaryMenuUi: SitePrimaryMenuUiOverride = {
  interactive:
    "motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98]",

  link: "text-current/85 hover:text-current motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out",
} as const;
