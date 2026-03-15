/**
 * @file apps/studio/src/app/api/_adapters/pages/blocks/cells/spacer.ts
 */

import { trimOrKeep } from "@compoz/studio/lib/strings";

import type { SpacerCell } from "@compoz/core/domain/pages/entities/cell";
import type { SpacerCellIntentDTO } from "@compoz/validation/pages/blocks/cells/cell-intents";

export function adaptSpacerCell(dto: SpacerCellIntentDTO): SpacerCell {
  return {
    id: trimOrKeep(dto.id),
    kind: "spacer",
    size: dto.size,
  };
}
