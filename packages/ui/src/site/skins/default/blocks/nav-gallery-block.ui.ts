/**
 * @file packages/ui/src/site/skins/default/blocks/nav-gallery-block.ui.ts
 * @layer ui/public/skins
 *
 * @description
 * Skin UI — gallery block (Default).
 *
 * @remarks
 * - Neutre et cohérent avec les autres blocs.
 * - Le full style vit ici (aucun fallback dans le composant).
 */

import type { GalleryMaxColumns } from "@compoz/core/domain/pages/entities/cell";
import type { PublicNavGalleryUi } from "@compoz/ui/site/public-ui.types";

const DEFAULT_COLUMNS: Readonly<Record<GalleryMaxColumns, string>> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-1 sm:grid-cols-3 lg:grid-cols-5",
} as const;

export const defaultNavGalleryUi: PublicNavGalleryUi = {
  // Grid sobre (les colonnes viennent de `columns`)
  list: "grid gap-6",
  columns: DEFAULT_COLUMNS,

  // Link “standard” (accessibilité)
  link: "block w-full h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",

  // Figure neutre (ratio square, léger fond)
  figure:
    "group relative w-full aspect-square overflow-hidden rounded-lg bg-muted",

  // Image : cover + hover léger (PRM safe)
  image:
    "absolute inset-0 h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-safe:group-hover:scale-[1.02]",

  // Overlay : visible au hover/focus, toujours visible sur devices sans hover (PRM safe)
  overlayPanel:
    "absolute inset-0 flex items-end p-4 bg-gradient-to-t from-black/60 to-black/0 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 motion-safe:transition-opacity [@media(hover:none)]:opacity-100 motion-safe:group-hover:[will-change:opacity] motion-reduce:transition-none",

  overlayContent:
    "pointer-events-none text-white text-2xl font-bold leading-tight",
} as const;
