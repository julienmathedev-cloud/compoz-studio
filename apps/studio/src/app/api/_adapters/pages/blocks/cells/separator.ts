/**
 * @file apps/studio/src/app/api/_adapters/pages/blocks/cells/separator.ts
 */

import { trimClearableOrUndef, trimOrKeep } from "@compoz/studio/lib/strings";

import type { SeparatorCell } from "@compoz/core/domain/pages/entities/cell";
import type { SeparatorCellIntentDTO } from "@compoz/validation/pages/blocks/cells/cell-intents";

export function adaptSeparatorCell(dto: SeparatorCellIntentDTO): SeparatorCell {
  return {
    id: trimOrKeep(dto.id),
    kind: "separator",
    cssClassName: trimClearableOrUndef(dto.cssClassName),
    align: dto.align,
    size: dto.size,
  };
}
