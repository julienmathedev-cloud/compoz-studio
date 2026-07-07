/**
 * @file packages/ui/src/renderer/cells/GalleryCellRenderer.tsx
 * @layer ui/renderer/cells
 *
 * @description
 * Renders a validated image gallery cell.
 *
 * @remarks
 * Selects the skin column variant from `maxColumns` and delegates rendering to either the navigation or zoom gallery list.
 */

import type { GalleryMaxColumns } from "@compoz/core/domain/pages/entities/cell";
import type { GalleryCellShape } from "@compoz/validation/pages/blocks/cells/cell";

import { cn } from "@compoz/ui/lib/utils";
import { SiteGalleryNavList } from "@compoz/ui/site/components/organisms/SiteGalleryNavList";
import { SiteGalleryZoomList } from "@compoz/ui/site/components/organisms/SiteGalleryZoomList";
import type {
  SiteNavGalleryUi,
  SiteRevealPresetUi,
  SiteZoomGalleryUi,
} from "@compoz/ui/site/site-ui.types";

export type GalleryCellRendererProps = Readonly<{
  cell: GalleryCellShape;
  navUi: SiteNavGalleryUi;
  zoomUi: SiteZoomGalleryUi;
  revealUi: SiteRevealPresetUi;
  priority?: boolean;
}>;

export function GalleryCellRenderer({
  cell,
  navUi,
  zoomUi,
  revealUi,
  priority,
}: GalleryCellRendererProps) {
  const items = Array.isArray(cell?.items) ? cell.items : [];
  if (items.length === 0) return null;

  const max = clampMaxColumns(cell.maxColumns);
  const reveal = cell.reveal === true;

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
      revealUi={revealUi}
      columns={max}
      priority={priority}
      reveal={reveal}
    />
  ) : (
    <SiteGalleryZoomList
      images={items}
      ui={resolvedZoomUi}
      revealUi={revealUi}
      columns={max}
      priority={priority}
      reveal={reveal}
    />
  );
}

GalleryCellRenderer.displayName = "GalleryCellRenderer";

function clampMaxColumns(v: unknown): GalleryMaxColumns {
  return v === 1 || v === 2 || v === 3 || v === 4 || v === 5 || v === 6 ? v : 3;
}
