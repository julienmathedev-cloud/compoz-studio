/**
 * @file apps/studio/src/app/api/_adapters/pages/blocks/cells/spacer.ts
 */

import { trimClearableOrUndef, trimOrKeep } from "@compoz/studio/lib/strings";

import type { SpacerCell } from "@compoz/core/domain/pages/entities/cell";
import type { SpacerCellIntentDTO } from "@compoz/validation/pages/blocks/cells/cell-intents";

function normalizeVisibility(
  visibility: SpacerCellIntentDTO["visibility"] | undefined,
): SpacerCell["visibility"] {
  return {
    mobile: visibility?.mobile ?? true,
    tablet: visibility?.tablet ?? true,
    desktop: visibility?.desktop ?? true,
  };
}

export function adaptSpacerCell(dto: SpacerCellIntentDTO): SpacerCell {
  return {
    id: trimOrKeep(dto.id),
    kind: "spacer",
    cssClassName: trimClearableOrUndef(dto.cssClassName),
    size: dto.size,
    visibility: normalizeVisibility(dto.visibility),
  };
}
