/**
 * @file apps/studio/src/app/api/_adapters/pages/blocks/cells/heading.ts
 */

import { trimOrKeep } from "@compoz/studio/lib/strings";

import type { HeadingCell } from "@compoz/core/domain/pages/entities/cell";
import type { HeadingCellIntentDTO } from "@compoz/validation/pages/blocks/cells/cell-intents";

export function adaptHeadingCell(dto: HeadingCellIntentDTO): HeadingCell {
  return {
    id: trimOrKeep(dto.id),
    kind: "heading",
    level: dto.level,
    title: trimOrKeep(dto.title),
    subtitle:
      typeof dto.subtitle === "string"
        ? trimOrKeep(dto.subtitle)
        : dto.subtitle,
    align: dto.align,
    variant: dto.variant,
    separator: dto.separator,
    idAnchor:
      typeof dto.idAnchor === "string"
        ? trimOrKeep(dto.idAnchor)
        : dto.idAnchor,
    reveal: dto.reveal,

    highlights: (dto.highlights ?? [])
      .map((item) => trimOrKeep(item))
      .filter(Boolean),
  };
}
