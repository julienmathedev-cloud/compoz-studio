/**
 * @file apps/studio/src/app/api/_adapters/pages/blocks/cells/buttons.ts
 * @layer studio/app/api/adapters
 *
 * @description
 * Studio API adapter for `ButtonsCell` values.
 */

import { trimClearableOrUndef, trimOrKeep } from "@compoz/studio/lib/strings";

import type {
  ButtonItem,
  ButtonsCell,
} from "@compoz/core/domain/pages/entities/cell";
import type {
  ButtonItemIntentDTO,
  ButtonsCellIntentDTO,
} from "@compoz/validation/pages/blocks/cells/cell-intents";

export function adaptButtonItem(dto: ButtonItemIntentDTO): ButtonItem {
  return {
    id: trimOrKeep(dto.id),
    label: trimOrKeep(dto.label),
    href: trimOrKeep(dto.href),
    variant: dto.variant,
    icon: dto.icon ?? null,
    iconPosition: dto.iconPosition === "after" ? "after" : "before",
  };
}

export function adaptOptionalButtonItem(
  dto: ButtonItemIntentDTO | null,
): ButtonItem | null {
  if (!dto || trimOrKeep(dto.label).length === 0) {
    return null;
  }

  return adaptButtonItem(dto);
}

export function adaptButtonsCell(dto: ButtonsCellIntentDTO): ButtonsCell {
  return {
    id: trimOrKeep(dto.id),
    kind: "buttons",
    cssClassName: trimClearableOrUndef(dto.cssClassName),
    align: dto.align,
    gap: dto.gap,
    items: dto.items.map(adaptButtonItem),
  };
}
