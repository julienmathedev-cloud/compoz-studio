/**
 * @file packages/ui/src/site/skins/lola/logo.ui.ts
 * @layer ui/public/skins
 *
 * @description
 * Skin UI — logo public (thème Lola).
 *
 * @remarks
 * - Fournit uniquement des classes Tailwind (aucune logique).
 * - Consommé par `PublicLogo` via la prop `ui`.
 */

import type { PublicLogoUiOverride } from "@compoz/ui/site/public-ui.types";

export const lolaLogoUi: PublicLogoUiOverride = {
  link: "group rounded-md focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500",

  image:
    // ✅ PRM : transition + scale uniquement si motion autorisé
    "h-12 w-auto md:h-14 lg:h-16 select-none -my-2 motion-safe:transition motion-safe:duration-300 motion-safe:ease-out motion-safe:group-hover:scale-105 motion-safe:group-active:scale-95 group-hover:opacity-80",
} as const;
