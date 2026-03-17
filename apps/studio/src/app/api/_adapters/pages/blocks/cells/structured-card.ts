/**
 * @file apps/studio/src/app/api/_adapters/pages/blocks/cells/structured-card.ts
 * @layer studio/app/api/adapters
 * @description
 * Adapteurs API Studio pour les cellules de type `StructuredCardCell`.
 */

import { trimOrKeep } from "@compoz/studio/lib/strings";

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
  return {
    id: trimOrKeep(dto.id),
    image: dto.image ? adaptImage(dto.image) : undefined,
    title: trimOrKeep(dto.title),
    meta: dto.meta ? trimOrKeep(dto.meta) : undefined,
    sections: dto.sections.map(adaptStructuredCardSection),
  };
}

export function adaptStructuredCardCell(
  dto: StructuredCardCellIntentDTO,
): StructuredCardCell {
  return {
    id: trimOrKeep(dto.id),
    kind: "structuredCard",
    columns: dto.columns,
    items: dto.items.map(adaptStructuredCardItem),
  };
}
