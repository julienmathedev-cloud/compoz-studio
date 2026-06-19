/**
 * @file packages/core/src/domain/pages/entities/cells/carousel.ts
 * @layer core/domain/pages
 *
 * @description
 * Domain entities related to the Carousel cell.
 *
 * @remarks
 * A carousel is a layout cell responsible for rendering a homogeneous list
 * of supported items as slides.
 *
 * The carousel does not render arbitrary cells. It only supports specific
 * reusable item types.
 */

import type { ImageEditor } from "@compoz/core/domain/pages/entities/cells/image-editor";
import type { CardItem } from "@compoz/core/domain/pages/entities/items/card-item";
import type { ExtendedCardItem } from "@compoz/core/domain/pages/entities/items/extended-card-item";
import type { StructuredCardItem } from "@compoz/core/domain/pages/entities/items/structured-card-item";

/**
 * Visual variants supported by the carousel cell.
 */
export type CarouselVariant = "carousel" | "slider";

/**
 * Supported item kinds inside a carousel.
 *
 * @remarks
 * A carousel renders a homogeneous list of items: all items in the same cell
 * must share the same `itemKind`.
 *
 * - `"cardsExtended"` is a legacy persisted value kept only for backward
 *   compatibility with existing KV/database content.
 * - `"extendedCard"` is the current value written by the Studio.
 */
export type CarouselCurrentItemKind =
  | "image"
  | "card"
  | "extendedCard"
  | "structuredCard";

export type CarouselLegacyItemKind = "cardsExtended";

export type CarouselItemKind = CarouselCurrentItemKind | CarouselLegacyItemKind;

export function normalizeCarouselItemKind(
  kind: CarouselItemKind,
): CarouselCurrentItemKind {
  return kind === "cardsExtended" ? "extendedCard" : kind;
}

/**
 * Union of all items supported by a carousel.
 */
export type CarouselItem =
  | ImageEditor
  | CardItem
  | ExtendedCardItem
  | StructuredCardItem;

/**
 * Carousel cell.
 *
 * @remarks
 * - `variant` controls the visual behavior.
 * - `itemKind` identifies the homogeneous content type rendered by the slides.
 * - `items` contains the slide content.
 */
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
