/**
 * @file packages/ui/src/site/skins/default/cells/zoom-gallery-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — zoom gallery cell (Default).
 *
 * @remarks
 * - Neutre et cohérent avec les autres blocs.
 * - Full style vit ici (aucun fallback dans le composant).
 */

import type { GalleryMaxColumns } from "@compoz/core/domain/pages/entities/cell";
import type { SiteZoomGalleryUi } from "@compoz/ui/site/site-ui.types";
import { defaultLightboxUi } from "@compoz/ui/site/skins/default/molecules/lightbox.ui";

const DEFAULT_COLUMNS: Readonly<Record<GalleryMaxColumns, string>> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-1 sm:grid-cols-3 lg:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-4 lg:grid-cols-6",
} as const;

const DEFAULT_SIZES_BY_COLUMNS: Readonly<Record<GalleryMaxColumns, string>> = {
  1: "100vw",
  2: "(max-width: 640px) 100vw, 50vw",
  3: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  4: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw",
  5: "(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw",
  6: "(max-width: 640px) 100vw, (max-width: 1024px) 25vw, 16vw",
} as const;

export const defaultZoomGalleryUi: SiteZoomGalleryUi = {
  list: "grid gap-6",
  columns: DEFAULT_COLUMNS,
  sizesByColumns: DEFAULT_SIZES_BY_COLUMNS,

  button:
    "group relative z-10  block w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",

  figure: "relative w-full aspect-square overflow-hidden rounded-lg bg-muted",

  image:
    "absolute inset-0 h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-safe:group-hover:scale-[1.02]",

  overlayPanel:
    "pointer-events-none absolute inset-x-0 bottom-0 flex items-end p-4 bg-gradient-to-t from-popover to-popover/0 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100 motion-safe:transition-opacity motion-safe:duration-200 motion-safe:ease-out motion-safe:group-hover:[will-change:opacity] motion-reduce:transition-none",

  overlayContent:
    "pointer-events-none text-popover-foreground text-xl font-semibold leading-tight",

  lightbox: defaultLightboxUi,
} as const;
