/**
 * @file packages/ui/src/site/skins/default/mobile-menu.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI par défaut pour le menu mobile du site (thème Default).
 */

import type { SiteMobileMenuUi } from "@compoz/ui/site/site-ui.types";

export const defaultMobileMenuUi: SiteMobileMenuUi = {
  triggerButton: "inline-flex items-center justify-center rounded-md p-2",
  triggerIcon: "text-foreground",

  overlayBase:
    "fixed inset-0 z-40 bg-black/40 motion-safe:transition-opacity motion-safe:duration-200",
  overlayOpen: "opacity-100 pointer-events-auto",
  overlayClosed: "opacity-0 pointer-events-none",

  panelBase:
    "fixed inset-y-0 left-0 z-50 w-[85vw] max-w-sm bg-background shadow-xl motion-safe:transition-transform motion-safe:duration-200",
  panelOpen: "translate-x-0",
  panelClosed: "-translate-x-full",

  topBar:
    "flex items-center justify-end p-3 border-b border-border shrink-0 h-[var(--header-h,64px)]",
  closeButton: "inline-flex items-center justify-center rounded-md p-2",

  scrollArea: "h-[calc(100dvh-56px)] overflow-y-auto p-3",

  list: "flex flex-col gap-1",
  item: "w-full",

  interactive: "w-full",
  link: "text-base font-medium",

  details: "w-full",
  summary:
    "w-full flex items-center justify-between rounded-md px-3 py-3 hover:bg-muted",

  dropdownList: "mt-1 pl-2 flex flex-col gap-1",
  childItem: "w-full",
  childInteractive: "w-full",

  socialsRow:
    "mt-4 flex items-center justify-center gap-2 border-t border-border pt-4",

  socialLink: "rounded-md p-2 hover:bg-muted",
  socialIcon: "h-5 w-5",

  focusRing:
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",

  emptyState: "text-sm text-muted-foreground",
};
