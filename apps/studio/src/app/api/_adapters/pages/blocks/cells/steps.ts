/**
 * @file apps/studio/src/app/api/_adapters/pages/blocks/cells/steps.ts
 * @layer studio/app/api/adapters
 * @description
 * Adapteurs API Studio pour les cellules de type `StepsCell`.
 */

import { trimOrKeep } from "@compoz/studio/lib/strings";

import type {
  StepItem,
  StepsCell,
} from "@compoz/core/domain/pages/entities/cell";
import type {
  StepItemIntentDTO,
  StepsCellIntentDTO,
} from "@compoz/validation/pages/blocks/cells/cell-intents";

function adaptStepItem(dto: StepItemIntentDTO): StepItem {
  return {
    id: trimOrKeep(dto.id),
    title: trimOrKeep(dto.title),
    description: trimOrKeep(dto.description),
  };
}

export function adaptStepsCell(dto: StepsCellIntentDTO): StepsCell {
  return {
    id: trimOrKeep(dto.id),
    kind: "steps",
    variant: dto.variant,
    items: dto.items.map(adaptStepItem),
  };
}
