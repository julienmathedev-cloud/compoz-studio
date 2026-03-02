/**
 * @file packages/ui/src/site/skins/lola/moile-menu.ui.ts
 * @layer ui/public/skins
 *
 * @description
 * Skin UI — mobile menu (thème Lola).
 *
 * @remarks
 * - Override partiel basé sur le default.
 * - Look plus épuré, élégant, artistique.
 * - Accent sur la typo et l’underline actif.
 */

import type { PublicMobileMenuUiOverride } from "@compoz/ui/site/public-ui.types";

export const lolaMobileMenuUi: PublicMobileMenuUiOverride = {
  /* -------------------------------------------------------------------------- */
  /* Trigger                                                                    */
  /* -------------------------------------------------------------------------- */

  triggerButton:
    "md:hidden h-10 w-10 flex items-center justify-center rounded-md",

  triggerIcon: "text-zinc-900 transition-transform duration-300",

  /* -------------------------------------------------------------------------- */
  /* Overlay                                                                    */
  /* -------------------------------------------------------------------------- */

  overlayBase:
    "fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300",
  overlayOpen: "opacity-100 pointer-events-auto",
  overlayClosed: "opacity-0 pointer-events-none",

  /* -------------------------------------------------------------------------- */
  /* Panel                                                                      */
  /* -------------------------------------------------------------------------- */

  panelBase:
    "fixed inset-y-0 left-0 z-50 w-full h-[100dvh] flex flex-col bg-white transition-transform duration-300 will-change-transform",
  panelOpen: "translate-x-0",
  panelClosed: "-translate-x-full invisible pointer-events-none",

  /* -------------------------------------------------------------------------- */
  /* Topbar                                                                     */
  /* -------------------------------------------------------------------------- */

  topBar: "flex items-center border-b border-zinc-100 px-4 shrink-0",

  closeButton:
    "h-10 w-10 flex items-center justify-center rounded-md ml-auto hover:bg-zinc-100",

  /* -------------------------------------------------------------------------- */
  /* Content                                                                    */
  /* -------------------------------------------------------------------------- */

  scrollArea:
    "flex-1 overflow-y-auto px-4 pb-[max(env(safe-area-inset-bottom),1rem)]",

  list: "space-y-1 pt-4",

  item: "w-full text-center",

  /* -------------------------------------------------------------------------- */
  /* Links                                                                      */
  /* -------------------------------------------------------------------------- */

  interactive:
    "inline-flex transition-transform duration-300 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-105 motion-safe:active:scale-95 hover:opacity-80",

  link: "block w-full py-3 text-lg text-center no-underline aria-[current=page]:underline aria-[current=page]:decoration-1 aria-[current=page]:underline-offset-6",

  /* -------------------------------------------------------------------------- */
  /* Dropdown                                                                   */
  /* -------------------------------------------------------------------------- */

  details: "group",

  summary:
    "grid grid-cols-[1fr_auto_1fr] items-center justify-items-center gap-3 py-3 text-lg cursor-pointer select-none",

  dropdownList:
    "mt-1 space-y-1 overflow-hidden transition-all duration-300 max-h-0 opacity-0 group-open:max-h-96 group-open:opacity-100",

  childItem: "w-full text-center",

  childInteractive:
    "inline-flex transition-transform duration-300 ease-out hover:opacity-80",

  /* -------------------------------------------------------------------------- */
  /* Social                                                                     */
  /* -------------------------------------------------------------------------- */

  socialsRow: "mt-8 flex items-center justify-center gap-6",

  socialLink: "p-2 rounded-md hover:opacity-80",

  socialIcon: "h-5 w-5 text-zinc-700",

  /* -------------------------------------------------------------------------- */
  /* Focus                                                                      */
  /* -------------------------------------------------------------------------- */

  focusRing:
    "rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500",

  /* -------------------------------------------------------------------------- */
  /* Empty                                                                      */
  /* -------------------------------------------------------------------------- */

  emptyState: "text-sm text-zinc-400 text-center py-4",
};
