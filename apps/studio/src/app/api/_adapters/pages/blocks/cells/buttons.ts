/**
 * @file apps/studio/src/app/api/_adapters/pages/blocks/cells/buttons.ts
 */

import { trimOrKeep } from "@compoz/studio/lib/strings";

import type {
  ButtonItem,
  ButtonsCell,
} from "@compoz/core/domain/pages/entities/cell";
import type {
  ButtonItemIntentDTO,
  ButtonsCellIntentDTO,
} from "@compoz/validation/pages/blocks/cells/cell-intents";

function adaptButtonItem(dto: ButtonItemIntentDTO): ButtonItem {
  return {
    id: trimOrKeep(dto.id),
    label: trimOrKeep(dto.label),
    href: trimOrKeep(dto.href),
    variant: dto.variant,
  };
}

export function adaptButtonsCell(dto: ButtonsCellIntentDTO): ButtonsCell {
  return {
    id: trimOrKeep(dto.id),
    kind: "buttons",
    align: dto.align,
    gap: dto.gap,
    items: dto.items.map(adaptButtonItem),
  };
}
