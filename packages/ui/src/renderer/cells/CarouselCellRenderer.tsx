/**
 * @file packages/ui/src/renderer/cells/CarouselCellRenderer.tsx
 * @layer ui/renderer/cells
 *
 * @description
 * Renders a validated homogeneous carousel or slider cell.
 *
 * @remarks
 * Delegates homogeneous carousel items to `SiteCarousel` or `SiteSlider`.
 */

import type {
  CarouselCellShape,
  CarouselItemShape,
} from "@compoz/validation/pages/blocks/cells/cell";

import { SiteCarousel } from "@compoz/ui/site/components/organisms/SiteCarousel";
import { SiteSlider } from "@compoz/ui/site/components/organisms/SiteSlider";
import type { SiteCarouselUi } from "@compoz/ui/site/site-ui.types";

export type CarouselCellRendererProps = Readonly<{
  cell: CarouselCellShape;
  ui: SiteCarouselUi;
  isFullBleed?: boolean;
  priority?: boolean;
}>;

export function CarouselCellRenderer({
  cell,
  ui,
  isFullBleed = false,
  priority = false,
}: CarouselCellRendererProps) {
  if (cell.items.length === 0) return null;

  const items = cell.items as ReadonlyArray<CarouselItemShape>;

  if (cell.variant === "slider") {
    return (
      <SiteSlider
        itemKind={cell.itemKind}
        items={items}
        ui={ui}
        showDots={cell.showDots}
        showArrows={cell.showArrows}
        isFullBleed={isFullBleed}
        priority={priority}
      />
    );
  }

  return (
    <SiteCarousel
      itemKind={cell.itemKind}
      items={items}
      ui={ui}
      showDots={cell.showDots}
      showArrows={cell.showArrows}
      isFullBleed={isFullBleed}
      priority={priority}
    />
  );
}

CarouselCellRenderer.displayName = "CarouselCellRenderer";
