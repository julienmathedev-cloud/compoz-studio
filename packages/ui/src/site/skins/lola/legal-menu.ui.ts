/**
 * @file packages/ui/src/site/skins/lola/legal-menu.ui.ts
 * @layer ui/public/skins
 *
 * @description
 * Skin UI — menu légal public (thème Lola).
 *
 * @remarks
 * - Fournit uniquement des classes Tailwind (aucune logique).
 * - Consommé par `PublicLegalMenu` via la prop `ui`.
 */

import type { PublicLegalMenuUiOverride } from "@compoz/ui/site/public-ui.types";

export const lolaLegalMenuUi: PublicLegalMenuUiOverride = {
  nav: "justify-self-center lg:col-start-3 lg:justify-self-end",

  list: "m-0 p-0 list-none flex flex-wrap gap-6 lg:gap-4",

  interactive:
    "inline-flex motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-105 motion-safe:active:scale-95 hover:opacity-80",

  link: "underline! underline-offset-5 rounded-md text-muted-foreground focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 no-underline aria-[current=page]:underline aria-[current=page]:decoration-1 aria-[current=page]:underline-offset-5 data-[section-active=true]:underline data-[section-active=true]:decoration-1 data-[section-active=true]:underline-offset-5",
} as const;
