/**
 * @file packages/ui/src/site/skins/demo/cells/nav-gallery-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Override UI — nav gallery cell (thème Démo).
 */

import type { SiteNavGalleryUiOverride } from "@compoz/ui/site/site-ui.types";

export const demoNavGalleryUi: SiteNavGalleryUiOverride = {
  image:
    "motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-safe:group-hover:scale-[1.02]",

  overlayPanel:
    "bg-gradient-to-t from-popover/60 to-popover/0 [@media(hover:none)]:opacity-100 motion-safe:group-hover:[will-change:opacity] motion-reduce:transition-none",

  overlayContent: "text-2xl font-bold",
} as const;
