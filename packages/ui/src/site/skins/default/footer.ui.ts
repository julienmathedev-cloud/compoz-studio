/**
 * @file packages/ui/src/site/skins/default/footer.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — footer site (thème Default).
 */

import type { SiteFooterUi } from "@compoz/ui/site/site-ui.types";
import { defaultLegalMenuUi } from "@compoz/ui/site/skins/default/legal-menu.ui";

export const defaultFooterUi: SiteFooterUi = {
  footer: "w-full border-t border-border bg-chrome",

  footerContainer:
    "mx-auto max-w-screen-xl px-2 py-1 md:px-4 md:py-4 grid grid-cols-1 lg:[grid-template-columns:1fr_auto_1fr] items-center gap-4 text-sm",

  poweredBy:
    "text-center lg:col-start-1 lg:justify-self-start text-muted-foreground",

  poweredByLink:
    "underline-offset-4 transition-colors hover:text-foreground hover:underline",

  copyright:
    "lg:col-start-2 justify-self-center text-center text-muted-foreground",

  legalMenu: defaultLegalMenuUi,
};
