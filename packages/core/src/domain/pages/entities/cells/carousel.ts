/**
 * @file packages/core/src/domain/pages/entities/cells/carousel.ts
 * @layer core/domain/pages
 * @description Carousel cell domain entity.
 * @remarks
 * A carousel renders a homogeneous list of supported reusable item types as slides.
 */

import type { ImageEditor } from "@compoz/core/domain/pages/entities/cells/image-editor";
import type { CardItem } from "@compoz/core/domain/pages/entities/items/card-item";
import type { ExtendedCardItem } from "@compoz/core/domain/pages/entities/items/extended-card-item";
import type { StructuredCardItem } from "@compoz/core/domain/pages/entities/items/structured-card-item";

export type CarouselVariant = "carousel" | "slider";

/**
 * Supported item kinds inside a carousel.
 *
 * @remarks
 * All items in the same carousel cell must share the same `itemKind`.
 */
export type CarouselItemKind =
  | "image"
  | "card"
  | "extendedCard"
  | "structuredCard";

export type CarouselItem =
  | ImageEditor
  | CardItem
  | ExtendedCardItem
  | StructuredCardItem;

export type CarouselCell = {
  id: string;
  kind: "carousel";
  cssClassName?: string;
  variant: CarouselVariant;
  showDots: boolean;
  showArrows: boolean;
  itemKind: CarouselItemKind;
  items: ReadonlyArray<CarouselItem>;
};
