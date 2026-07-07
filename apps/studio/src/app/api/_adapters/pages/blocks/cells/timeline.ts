/**
 * @file apps/studio/src/app/api/_adapters/pages/blocks/cells/timeline.ts
 * @layer studio/app/api/adapters
 *
 * @description
 * Studio API adapter for `TimelineCell` values.
 *
 * @remarks
 * - Defaults `collapsible` to `true` when the intent does not provide it.
 */

import { trimClearableOrUndef, trimOrKeep } from "@compoz/studio/lib/strings";

import type {
  TimelineCell,
  TimelineItem,
} from "@compoz/core/domain/pages/entities/cell";
import type {
  TimelineCellIntentDTO,
  TimelineItemIntentDTO,
} from "@compoz/validation/pages/blocks/cells/cell-intents";

function adaptTimelineItem(dto: TimelineItemIntentDTO): TimelineItem {
  return {
    id: trimOrKeep(dto.id),
    period: trimOrKeep(dto.period),
    title: trimOrKeep(dto.title),

    subtitle: dto.subtitle ? trimOrKeep(dto.subtitle) : null,
    description: dto.description ? trimOrKeep(dto.description) : null,
    badge: dto.badge ? trimOrKeep(dto.badge) : null,

    keywords: (dto.keywords ?? [])
      .map((keyword) => trimOrKeep(keyword))
      .filter(Boolean),
  };
}

export function adaptTimelineCell(dto: TimelineCellIntentDTO): TimelineCell {
  return {
    id: trimOrKeep(dto.id),
    kind: "timeline",
    cssClassName: trimClearableOrUndef(dto.cssClassName),
    collapsible: dto.collapsible ?? true,
    items: dto.items.map(adaptTimelineItem),
  };
}
