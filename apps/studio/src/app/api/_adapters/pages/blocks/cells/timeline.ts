/**
 * @file apps/studio/src/app/api/_adapters/pages/blocks/cells/timeline.ts
 * @layer studio/app/api/adapters
 * @description
 * Adapteurs API Studio pour les cellules de type `TimelineCell`.
 */

import { trimOrKeep } from "@compoz/studio/lib/strings";

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
    subtitle: dto.subtitle ? trimOrKeep(dto.subtitle) : undefined,
    description: dto.description ? trimOrKeep(dto.description) : undefined,
    badge: dto.badge ? trimOrKeep(dto.badge) : undefined,
    keywords: dto.keywords
      ?.map((keyword) => trimOrKeep(keyword))
      .filter(Boolean),
  };
}

export function adaptTimelineCell(dto: TimelineCellIntentDTO): TimelineCell {
  return {
    id: trimOrKeep(dto.id),
    kind: "timeline",
    items: dto.items.map(adaptTimelineItem),
  };
}
