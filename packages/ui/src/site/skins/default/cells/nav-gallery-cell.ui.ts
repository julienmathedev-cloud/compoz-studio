/**
 * @file packages/ui/src/site/skins/default/cells/nav-gallery-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — gallery cell (Default).
 *
 * @remarks
 * - Neutre et cohérent avec les autres blocs.
 * - Le full style vit ici (aucun fallback dans le composant).
 */

import type { GalleryMaxColumns } from "@compoz/core/domain/pages/entities/cell";
import type { SiteNavGalleryUi } from "@compoz/ui/site/site-ui.types";

const DEFAULT_COLUMNS: Readonly<Record<GalleryMaxColumns, string>> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-1 sm:grid-cols-3 lg:grid-cols-5",
} as const;

export const defaultNavGalleryUi: SiteNavGalleryUi = {
  list: "grid gap-6",
  columns: DEFAULT_COLUMNS,

  link: "block w-full h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",

  figure:
    "group relative w-full aspect-square overflow-hidden rounded-lg bg-muted",

  image: "absolute inset-0 h-full w-full object-cover",

  overlayPanel:
    "absolute inset-x-0 bottom-0 flex items-end p-4 bg-popover opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 motion-safe:transition-opacity motion-safe:duration-200 motion-safe:ease-out",

  overlayContent:
    "pointer-events-none text-popover-foreground text-xl font-semibold leading-tight",
} as const;
