/**
 * @file apps/studio/src/app/api/_adapters/pages/blocks/cells/carousel.ts
 * @layer studio/app/api/adapters
 * @description
 * Adapteurs API Studio pour les cellules de type `CarouselCell`.
 */

import { trimOrKeep } from "@compoz/studio/lib/strings";

import type { CarouselCell } from "@compoz/core/domain/pages/entities/cell";
import { adaptCardsCell } from "@compoz/studio/app/api/_adapters/pages/blocks/cells/cards";
import { adaptCardsExtendedCell } from "@compoz/studio/app/api/_adapters/pages/blocks/cells/cards-extended";
import { adaptImage } from "@compoz/studio/app/api/_adapters/pages/blocks/cells/image";
import { adaptStructuredCardCell } from "@compoz/studio/app/api/_adapters/pages/blocks/cells/structured-card";
import type {
  CardItemIntentDTO,
  CardsExtendedItemIntentDTO,
  CarouselCellIntentDTO,
  ImageEditorIntentDTO,
  StructuredCardItemIntentDTO,
} from "@compoz/validation/pages/blocks/cells/cell-intents";

export function adaptCarouselCell(dto: CarouselCellIntentDTO): CarouselCell {
  const items =
    dto.itemKind === "image"
      ? (dto.items as ImageEditorIntentDTO[]).map((item) => adaptImage(item))
      : dto.itemKind === "card"
        ? adaptCardsCell({
            id: dto.id,
            kind: "cards",
            columns: 2,
            align: "left",
            items: dto.items as CardItemIntentDTO[],
          }).items
        : dto.itemKind === "cardsExtended"
          ? adaptCardsExtendedCell({
              id: dto.id,
              kind: "cardsExtended",
              columns: 2,
              align: "left",
              items: dto.items as CardsExtendedItemIntentDTO[],
            }).items
          : adaptStructuredCardCell({
              id: dto.id,
              kind: "structuredCard",
              columns: 1,
              items: dto.items as StructuredCardItemIntentDTO[],
            }).items;

  return {
    id: trimOrKeep(dto.id),
    kind: "carousel",
    variant: dto.variant,
    showDots: dto.showDots,
    showArrows: dto.showArrows,
    itemKind: dto.itemKind,
    items,
  };
}
