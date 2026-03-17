/**
 * @file packages/ui/src/renderer/cells/GalleryCellRenderer.tsx
 * @layer ui/renderer/cells
 *
 * @description
 * Cell renderer site/preview : rendu d’une galerie d’images (V0.5).
 *
 * @remarks
 * - Le style est 100% piloté par `ui` (skin).
 * - `maxColumns` est data-driven (cell) : on sélectionne une variante fournie par le skin.
 */

import type { GalleryMaxColumns } from "@compoz/core/domain/pages/entities/cell";
import type { GalleryCellShape } from "@compoz/validation/pages/blocks/cells/cell";

import { cn } from "@compoz/ui/lib/utils";
import { SiteGalleryNavList } from "@compoz/ui/site/components/organisms/SiteGalleryNavList";
import { SiteGalleryZoomList } from "@compoz/ui/site/components/organisms/SiteGalleryZoomList";
import type {
  SiteNavGalleryUi,
  SiteZoomGalleryUi,
} from "@compoz/ui/site/site-ui.types";

export type GalleryCellRendererProps = Readonly<{
  cell: GalleryCellShape;
  navUi: SiteNavGalleryUi;
  zoomUi: SiteZoomGalleryUi;
  priority?: boolean;
}>;

export function GalleryCellRenderer({
  cell,
  navUi,
  zoomUi,
  priority,
}: GalleryCellRendererProps) {
  const items = Array.isArray(cell?.items) ? cell.items : [];
  if (items.length === 0) return null;

  const max = clampMaxColumns(cell.maxColumns);

  const resolvedNavUi: SiteNavGalleryUi = {
    ...navUi,
    list: cn(navUi.list, navUi.columns[max]),
  };

  const resolvedZoomUi: SiteZoomGalleryUi = {
    ...zoomUi,
    list: cn(zoomUi.list, zoomUi.columns[max]),
  };

  return cell.linksEnabled ? (
    <SiteGalleryNavList
      images={items}
      ui={resolvedNavUi}
      columns={max}
      priority={priority}
    />
  ) : (
    <SiteGalleryZoomList
      images={items}
      ui={resolvedZoomUi}
      columns={max}
      priority={priority}
    />
  );
}

GalleryCellRenderer.displayName = "GalleryCellRenderer";

function clampMaxColumns(v: unknown): GalleryMaxColumns {
  return v === 1 || v === 2 || v === 3 || v === 4 || v === 5 ? v : 3;
}
