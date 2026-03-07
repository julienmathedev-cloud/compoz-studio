/**
 * @file packages/ui/src/site/skins/lola/system-page.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — "system page" site (thème Lola).
 *
 * @remarks
 * - Base commune utilisée pour `errorPage` et `notFoundPage`.
 * - Si besoin de différencier plus tard : faire un spread + override ciblé.
 */

import type { SiteSystemPageUiOverride } from "@compoz/ui/site/site-ui.types";

export const lolaSystemPageUi: SiteSystemPageUiOverride = {
  main: "mx-auto max-w-screen-xl px-3 md:px-4 lg:px-6 py-20",

  actions: "flex flex-wrap items-center gap-4 pt-6",

  button:
    "inline-flex items-center rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium motion-safe:transition-opacity motion-safe:duration-200 hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500",
} as const;
