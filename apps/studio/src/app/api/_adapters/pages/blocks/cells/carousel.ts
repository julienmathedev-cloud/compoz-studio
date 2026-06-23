/**
 * @file apps/studio/src/app/api/_adapters/pages/blocks/cells/carousel.ts
 * @layer studio/app/api/adapters
 *
 * @description
 * Studio API adapter for CarouselCell.
 *
 * @remarks
 * The carousel adapter owns cell-level concerns such as `variant`,
 * `showDots`, `showArrows`, `itemKind`, and `cssClassName`.
 *
 * Reusable item shapes are delegated to item adapters.
 */

import type { CarouselCell } from "@compoz/core/domain/pages/entities/cell";
import { adaptImage } from "@compoz/studio/app/api/_adapters/pages/blocks/cells/image";
import { adaptCardItem } from "@compoz/studio/app/api/_adapters/pages/blocks/items/card-item";
import { adaptExtendedCardItem } from "@compoz/studio/app/api/_adapters/pages/blocks/items/extended-card-item";
import { adaptStructuredCardItem } from "@compoz/studio/app/api/_adapters/pages/blocks/items/structured-card-item";
import { trimClearableOrUndef, trimOrKeep } from "@compoz/studio/lib/strings";
import type {
  CardItemIntentDTO,
  CarouselCellIntentDTO,
  ExtendedCardItemIntentDTO,
  ImageEditorIntentDTO,
  StructuredCardItemIntentDTO,
} from "@compoz/validation/pages/blocks/cells/cell-intents";

export function adaptCarouselCell(dto: CarouselCellIntentDTO): CarouselCell {
  const itemKind = dto.itemKind;

  const items =
    itemKind === "image"
      ? (dto.items as ImageEditorIntentDTO[]).map(adaptImage)
      : itemKind === "card"
        ? (dto.items as CardItemIntentDTO[]).map(adaptCardItem)
        : itemKind === "extendedCard"
          ? (dto.items as ExtendedCardItemIntentDTO[]).map(
              adaptExtendedCardItem,
            )
          : (dto.items as StructuredCardItemIntentDTO[]).map(
              adaptStructuredCardItem,
            );

  return {
    id: trimOrKeep(dto.id),
    kind: "carousel",
    cssClassName: trimClearableOrUndef(dto.cssClassName),
    variant: dto.variant,
    showDots: dto.showDots,
    showArrows: dto.showArrows,
    itemKind,
    items,
  };
}
