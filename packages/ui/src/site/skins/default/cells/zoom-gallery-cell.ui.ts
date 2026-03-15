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
} as const;

export const defaultZoomGalleryUi: SiteZoomGalleryUi = {
  // Grid sobre (les colonnes viennent de `columns`)
  list: "grid gap-6",
  columns: DEFAULT_COLUMNS,

  // Bouton accessible (focus visible)
  button:
    "block w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",

  // Figure neutre (square + léger fond)
  figure:
    "group relative w-full aspect-square overflow-hidden rounded-lg bg-muted",

  // Image cover + hover léger (PRM safe)
  image:
    "absolute inset-0 h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-safe:group-hover:scale-[1.02]",

  // Overlay identique à ton style (PRM safe)
  overlayPanel:
    "absolute inset-0 flex items-end p-4 bg-gradient-to-t from-black/60 to-black/0 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 motion-safe:transition-opacity [@media(hover:none)]:opacity-100 motion-safe:group-hover:[will-change:opacity] motion-reduce:transition-none",

  overlayContent:
    "pointer-events-none text-white text-2xl font-bold leading-tight",

  lightbox: defaultLightboxUi,
} as const;
