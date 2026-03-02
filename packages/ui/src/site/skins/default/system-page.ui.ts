/**
 * @file packages/ui/src/site/skins/default/system-page.ui.ts
 * @layer ui/public/skins
 *
 * @description
 * Skin UI — "system page" public (thème Default).
 *
 * @remarks
 * - Base commune utilisée pour `errorPage` et `notFoundPage`.
 * - Si besoin de différencier plus tard : faire un spread + override ciblé.
 */

import type { PublicSystemPageUi } from "@compoz/ui/site/public-ui.types";

export const defaultSystemPageUi: PublicSystemPageUi = {
  main: "w-full mx-auto max-w-screen-xl px-3 md:px-4 lg:px-6 py-16 md:py-20 lg:py-24",

  prose: "space-y-4",

  title: "tracking-tight",

  description: "text-muted-foreground",

  actions: "flex flex-wrap items-center gap-3 pt-4",

  // ✅ PRM : transition + hover uniquement si motion autorisé
  button:
    "inline-flex items-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium motion-safe:transition-colors motion-safe:duration-200 motion-safe:hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
} as const;
