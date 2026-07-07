/**
 * @file apps/studio/src/app/api/_adapters/pages/blocks/items/extended-card-item.ts
 * @layer studio/app/api/adapters
 *
 * @description
 * Studio API adapter for reusable extended card item shapes.
 *
 * @remarks
 * - Cell-level fields such as `kind`, `columns`, `align`, `reveal`, and
 *   `cssClassName` are handled by parent cell adapters.
 */

import type { ExtendedCardItem } from "@compoz/core/domain/pages/entities/cell";
import type { ExtendedCardItemIntentDTO } from "@compoz/validation/pages/blocks/cells/cell-intents";

import { trimOrKeep } from "@compoz/studio/lib/strings";

export function adaptExtendedCardItem(
  dto: ExtendedCardItemIntentDTO,
): ExtendedCardItem {
  return {
    id: trimOrKeep(dto.id),
    title: trimOrKeep(dto.title),
    description: trimOrKeep(dto.description),

    bullets: dto.bullets.map((bullet) => trimOrKeep(bullet)).filter(Boolean),

    footer: dto.footer ? trimOrKeep(dto.footer) : null,
    icon: dto.icon ? (trimOrKeep(dto.icon) as ExtendedCardItem["icon"]) : null,
  };
}
