/**
 * @file packages/ui/src/site/skins/portfolio/primary-menu.ui.ts
 * @layer ui/site/skins/portfolio
 *
 * @description
 * Defines the portfolio skin overrides for the public site primary menu.
 */

import type { SitePrimaryMenuUiOverride } from "@compoz/ui/site/site-ui.types";

export const portfolioPrimaryMenuUi: SitePrimaryMenuUiOverride = {
  interactive:
    "justify-center whitespace-nowrap rounded-md shrink-0 disabled:pointer-events-none disabled:opacity-50 group font-normal motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out motion-safe:hover:translate-y-[-1px] motion-safe:hover:scale-[1.01] motion-safe:active:scale-[0.98] motion-safe:hover:opacity-100",

  link: "px-4 py-2 hover:text-primary group aria-[current=page]:no-underline data-[section-active=true]:no-underline",

  label:
    "relative inline-block text-muted-foreground motion-safe:transition-colors motion-safe:duration-300 motion-safe:ease-out after:absolute after:left-0 after:bottom-[-1px] after:h-[1px] after:w-0 after:bg-current after:transition-[width] after:duration-300 after:ease-out group-hover:text-primary group-hover:after:w-full group-aria-[current=page]:text-primary group-aria-[current=page]:after:w-full group-data-[section-active=true]:text-primary group-data-[section-active=true]:after:w-full",
} as const;
