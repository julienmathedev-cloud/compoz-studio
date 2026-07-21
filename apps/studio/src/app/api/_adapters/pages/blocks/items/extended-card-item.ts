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

import { adaptOptionalButtonItem } from "@compoz/studio/app/api/_adapters/pages/blocks/cells/buttons";
import { trimOrKeep } from "@compoz/studio/lib/strings";

export function adaptExtendedCardItem(
  dto: ExtendedCardItemIntentDTO,
): ExtendedCardItem {
  const eyebrow = dto.eyebrow ? trimOrKeep(dto.eyebrow) : "";
  const footer = dto.footer ? trimOrKeep(dto.footer) : "";

  return {
    id: trimOrKeep(dto.id),
    eyebrow: eyebrow.length > 0 ? eyebrow : null,
    title: trimOrKeep(dto.title),
    description: trimOrKeep(dto.description),
    bullets: dto.bullets.map((bullet) => trimOrKeep(bullet)).filter(Boolean),
    footer: footer.length > 0 ? footer : null,
    icon: dto.icon ?? null,
    button: adaptOptionalButtonItem(dto.button),
  };
}
