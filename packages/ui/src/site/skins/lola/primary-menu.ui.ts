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
  // List.
  list: "m-0 p-0 list-none flex flex-wrap items-center gap-4 md:gap-7 lg:gap-10",

  // Zone interactive commune (lien + trigger dropdown).
  interactive:
    "inline-flex motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-105 motion-safe:active:scale-95 hover:opacity-80",

  link: "rounded-md focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 no-underline aria-[current=page]:underline aria-[current=page]:decoration-1 aria-[current=page]:underline-offset-5 data-[section-active=true]:underline data-[section-active=true]:decoration-1 data-[section-active=true]:underline-offset-5",

  dropdownPanel:
    "z-[80] p-2 bg-white rounded-md border border-zinc-100 motion-safe:transition-opacity motion-safe:duration-150",
} as const;
