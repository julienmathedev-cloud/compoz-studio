/**
 * @file apps/studio/src/app/api/_adapters/pages/blocks/cells/structured-card.ts
 * @layer studio/app/api/adapters
 * @description
 * Adapteurs API Studio pour les cellules de type `StructuredCardCell`.
 */

import { trimClearableOrUndef, trimOrKeep } from "@compoz/studio/lib/strings";

import type {
  StructuredCardCell,
  StructuredCardItem,
  StructuredCardSection,
} from "@compoz/core/domain/pages/entities/cell";
import { adaptImage } from "@compoz/studio/app/api/_adapters/pages/blocks/cells/image";
import type {
  StructuredCardCellIntentDTO,
  StructuredCardItemIntentDTO,
  StructuredCardSectionIntentDTO,
} from "@compoz/validation/pages/blocks/cells/cell-intents";

function adaptStructuredCardSection(
  dto: StructuredCardSectionIntentDTO,
): StructuredCardSection {
  return {
    id: trimOrKeep(dto.id),
    label: trimOrKeep(dto.label),
    content: trimOrKeep(dto.content),
  };
}

function adaptStructuredCardItem(
  dto: StructuredCardItemIntentDTO,
): StructuredCardItem {
  const hasImage =
    dto.image != null && typeof dto.image.src === "string"
      ? trimOrKeep(dto.image.src).length > 0
      : false;

  const hasButtonLabel =
    dto.button != null && typeof dto.button.label === "string"
      ? trimOrKeep(dto.button.label).length > 0
      : false;

  return {
    id: trimOrKeep(dto.id),
    image: hasImage && dto.image ? adaptImage(dto.image) : null,
    title: trimOrKeep(dto.title),
    meta: dto.meta ? trimOrKeep(dto.meta) : null,
    sections: dto.sections.map(adaptStructuredCardSection),
    button:
      hasButtonLabel && dto.button
        ? {
            id: trimOrKeep(dto.button.id),
            label: trimOrKeep(dto.button.label),
            href: trimOrKeep(dto.button.href),
            variant: dto.button.variant,
            icon: dto.button.icon ?? null,
            iconPosition:
              dto.button.iconPosition === "after" ? "after" : "before",
          }
        : null,
  };
}

export function adaptStructuredCardCell(
  dto: StructuredCardCellIntentDTO,
): StructuredCardCell {
  return {
    id: trimOrKeep(dto.id),
    kind: "structuredCard",
    cssClassName: trimClearableOrUndef(dto.cssClassName),
    columns: dto.columns,
    reveal: dto.reveal,
    items: dto.items.map(adaptStructuredCardItem),
  };
}
