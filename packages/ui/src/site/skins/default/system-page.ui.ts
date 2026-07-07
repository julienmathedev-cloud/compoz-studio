/**
 * @file packages/ui/src/site/skins/default/system-page.ui.ts
 * @layer ui/site/skins/default
 *
 * @description
 * Defines the default skin classes for public site system pages.
 */

import type { SiteSystemPageUi } from "@compoz/ui/site/site-ui.types";

export const defaultSystemPageUi: SiteSystemPageUi = {
  main: "w-full mx-auto max-w-screen-xl px-3 md:px-4 lg:px-6 py-16 md:py-20 lg:py-24",

  prose: "space-y-4",

  title: "tracking-tight",

  description: "text-muted-foreground",

  actions: "flex flex-wrap items-center gap-3 pt-4",

  button:
    "inline-flex items-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
} as const;
