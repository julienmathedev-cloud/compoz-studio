/**
 * @file apps/studio/src/app/api/_adapters/pages/blocks/cells/case-study-card.ts
 * @layer studio/app/api/adapters
 * @description
 * Adapteurs API Studio pour les cellules de type `CaseStudyCardCell`.
 */

import { trimOrKeep } from "@compoz/studio/lib/strings";

import type {
  CaseStudyCardCell,
  CaseStudyCardItem,
} from "@compoz/core/domain/pages/entities/cell";
import { adaptImage } from "@compoz/studio/app/api/_adapters/pages/blocks/cells/image";
import type {
  CaseStudyCardCellIntentDTO,
  CaseStudyCardItemIntentDTO,
} from "@compoz/validation/pages/blocks/cells/cell-intents";

function adaptCaseStudyCardItem(
  dto: CaseStudyCardItemIntentDTO,
): CaseStudyCardItem {
  return {
    id: trimOrKeep(dto.id),
    image: dto.image ? adaptImage(dto.image) : undefined,
    title: trimOrKeep(dto.title),
    context: trimOrKeep(dto.context),
    solution: trimOrKeep(dto.solution),
    result: trimOrKeep(dto.result),
  };
}

export function adaptCaseStudyCardCell(
  dto: CaseStudyCardCellIntentDTO,
): CaseStudyCardCell {
  return {
    id: trimOrKeep(dto.id),
    kind: "caseStudyCard",
    columns: dto.columns,
    items: dto.items.map(adaptCaseStudyCardItem),
  };
}
