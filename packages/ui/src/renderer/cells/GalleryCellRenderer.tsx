/**
 * @file packages/ui/src/renderer/cells/GalleryCellRenderer.tsx
 * @layer ui/public/cells
 *
 * @description
 * Cell renderer public/preview : rendu d’une galerie d’images (V0.5).
 *
 * @remarks
 * - Le style est 100% piloté par `ui` (skin).
 * - `maxColumns` est data-driven (cell) : on sélectionne une variante fournie par le skin.
 */

import type { GalleryMaxColumns } from "@compoz/core/domain/pages/entities/cell";
import { cn } from "@compoz/ui/lib/utils";
import { PublicGalleryNavList } from "@compoz/ui/site/components/organisms/PublicGalleryNavList";
import { PublicGalleryZoomList } from "@compoz/ui/site/components/organisms/PublicGalleryZoomList";
import type {
  PublicNavGalleryUi,
  PublicZoomGalleryUi,
} from "@compoz/ui/site/public-ui.types";
import type { GalleryCellShape } from "@compoz/validation/pages/blocks/cells/cell";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type GalleryCellRendererProps = Readonly<{
  cell: GalleryCellShape;

  /** UI (skin) requis. */
  navUi: PublicNavGalleryUi;
  zoomUi: PublicZoomGalleryUi;
  priority?: boolean;
}>;

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function GalleryCellRenderer({
  cell,
  navUi,
  zoomUi,
  priority,
}: GalleryCellRendererProps) {
  const images = Array.isArray(cell?.images) ? cell.images : [];
  if (images.length === 0) return null;

  const max = clampMaxColumns(cell.maxColumns);

  // ✅ Compose “base list” + “variant columns” depuis le skin
  const resolvedNavUi: PublicNavGalleryUi = {
    ...navUi,
    list: cn(navUi.list, navUi.columns[max]),
  };

  const resolvedZoomUi: PublicZoomGalleryUi = {
    ...zoomUi,
    list: cn(zoomUi.list, zoomUi.columns[max]),
  };

  return cell.linksEnabled ? (
    <PublicGalleryNavList
      images={images}
      ui={resolvedNavUi}
      columns={max}
      priority={priority}
    />
  ) : (
    <PublicGalleryZoomList
      images={images}
      ui={resolvedZoomUi}
      columns={max}
      priority={priority}
    />
  );
}

GalleryCellRenderer.displayName = "GalleryCellRenderer";

/* -------------------------------------------------------------------------- */
/* Internals                                                                  */
/* -------------------------------------------------------------------------- */

function clampMaxColumns(v: unknown): GalleryMaxColumns {
  return v === 1 || v === 2 || v === 3 || v === 4 || v === 5 ? v : 3;
}
