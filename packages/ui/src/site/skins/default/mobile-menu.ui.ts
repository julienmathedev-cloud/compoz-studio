/**
 * @file packages/ui/src/site/skins/default/mobile-menu.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI par défaut pour le menu mobile du site (thème Default).
 *
 * @remarks
 * - Aligné visuellement avec le header desktop default.
 * - Surface sobre basée sur les tokens Tailwind/ShadCN.
 * - Interactions discrètes pour rester dans un socle générique.
 */

import type { SiteMobileMenuUi } from "@compoz/ui/site/site-ui.types";

export const defaultMobileMenuUi: SiteMobileMenuUi = {
  triggerButton:
    "inline-flex h-10 w-10 items-center justify-center rounded-md cursor-pointer",

  triggerIcon: "text-foreground",

  overlayBase:
    "fixed inset-0 z-60 h-[100dvh] bg-black/60 motion-safe:transition-opacity motion-safe:duration-200 motion-safe:ease-out",
  overlayOpen: "pointer-events-auto opacity-100",
  overlayClosed: "pointer-events-none opacity-0",

  panelBase:
    "fixed inset-y-0 left-0 z-70 flex h-[100dvh] w-full flex-col border-r border-border bg-background shadow-xl motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out will-change-transform",
  panelOpen: "translate-x-0 pointer-events-auto",
  panelClosed: "-translate-x-full pointer-events-none",

  topBar:
    "flex h-[var(--header-h,64px)] shrink-0 items-center border-b border-border px-3 md:px-4 lg:px-6",
  closeButton:
    "ml-auto inline-flex h-10 w-10 items-center justify-center rounded-md cursor-pointer text-foreground",

  scrollArea:
    "flex-1 overflow-y-auto px-4 pb-[max(env(safe-area-inset-bottom),1rem)]",

  list: "flex flex-col gap-1 pt-4",
  item: "w-full",

  interactive: "inline-flex w-full items-center justify-center cursor-pointer",

  link: "inline-flex w-full items-center justify-center rounded-md px-3 py-3 text-base font-medium no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-[current=page]:underline aria-[current=page]:decoration-1 aria-[current=page]:underline-offset-4 data-[section-active=true]:underline data-[section-active=true]:decoration-1 data-[section-active=true]:underline-offset-4",

  details: "group w-full",
  summary:
    "grid w-full cursor-pointer select-none grid-cols-[1fr_auto_1fr] items-center justify-items-center gap-3 rounded-md px-3 py-3 text-base font-medium",
  chevron:
    "shrink-0 motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out group-open:rotate-90",

  dropdownList:
    "mt-1 flex max-h-0 flex-col gap-1 overflow-hidden opacity-0 motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out group-open:max-h-96 group-open:opacity-100",

  childItem: "w-full",
  childInteractive:
    "inline-flex w-full items-center justify-center cursor-pointer",

  socialsRow:
    "mt-6 flex items-center justify-center gap-3 border-t border-border pt-5",

  socialLink:
    "inline-flex items-center justify-center rounded-md p-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",

  socialIcon: "h-5 w-5 text-foreground",

  focusRing:
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",

  emptyState: "py-4 text-center text-sm text-muted-foreground",
};
