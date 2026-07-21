/**
 * @file apps/studio/src/app/api/_adapters/pages/blocks/items/structured-card-item.ts
 * @layer studio/app/api/adapters
 *
 * @description
 * Studio API adapter for reusable structured card item shapes.
 *
 * @remarks
 * - Cell-level fields such as `kind`, `columns`, `reveal`, and `cssClassName`
 *   are handled by parent cell adapters.
 */

import type {
  StructuredCardItem,
  StructuredCardSection,
} from "@compoz/core/domain/pages/entities/cell";
import type {
  StructuredCardItemIntentDTO,
  StructuredCardSectionIntentDTO,
} from "@compoz/validation/pages/blocks/cells/cell-intents";

import { adaptOptionalButtonItem } from "@compoz/studio/app/api/_adapters/pages/blocks/cells/buttons";
import { adaptImage } from "@compoz/studio/app/api/_adapters/pages/blocks/cells/image";
import { trimOrKeep } from "@compoz/studio/lib/strings";

function adaptStructuredCardSection(
  dto: StructuredCardSectionIntentDTO,
): StructuredCardSection {
  return {
    id: trimOrKeep(dto.id),
    label: trimOrKeep(dto.label),
    content: trimOrKeep(dto.content),
  };
}

export function adaptStructuredCardItem(
  dto: StructuredCardItemIntentDTO,
): StructuredCardItem {
  const hasImage = dto.image != null && trimOrKeep(dto.image.src).length > 0;

  const meta = dto.meta ? trimOrKeep(dto.meta) : "";

  return {
    id: trimOrKeep(dto.id),
    image: hasImage && dto.image ? adaptImage(dto.image) : null,
    title: trimOrKeep(dto.title),
    meta: meta.length > 0 ? meta : null,
    sections: dto.sections.map(adaptStructuredCardSection),
    button: adaptOptionalButtonItem(dto.button),
  };
}
