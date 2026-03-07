/**
 * @file packages/ui/src/site/skins/lola/logo.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — logo site (thème Lola).
 *
 * @remarks
 * - Fournit uniquement des classes Tailwind (aucune logique).
 * - Consommé par `SiteLogo` via la prop `ui`.
 */

import type { SiteLogoUiOverride } from "@compoz/ui/site/site-ui.types";

export const lolaLogoUi: SiteLogoUiOverride = {
  link: "group rounded-md focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500",

  image:
    // ✅ PRM : transition + scale uniquement si motion autorisé
    "h-12 w-auto md:h-14 lg:h-16 select-none -my-2 motion-safe:transition motion-safe:duration-300 motion-safe:ease-out motion-safe:group-hover:scale-105 motion-safe:group-active:scale-95 group-hover:opacity-80",
} as const;
