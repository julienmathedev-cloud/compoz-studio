/**
 * @file packages/core/src/domain/pages/validators/cells/timeline.ts
 * @layer core/domain/pages/validators
 * @description
 * Validateur métier de TimelineCell.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type {
  Cell,
  TimelineItem,
} from "@compoz/core/domain/pages/entities/cell";

type Path = ReadonlyArray<string | number>;

export function assertTimelineCell(
  cell: Extract<Cell, { kind: "timeline" }>,
  path: Path,
) {
  if (!Array.isArray(cell.items)) {
    throw new DomainError({
      code: EC.CELL_TIMELINE_ITEMS_INVALID,
      message: EC.CELL_TIMELINE_ITEMS_INVALID,
      details: { path: [...path, "items"] },
    });
  }

  if (cell.items.length < 1) {
    throw new DomainError({
      code: EC.CELL_TIMELINE_ITEMS_MIN_1,
      message: EC.CELL_TIMELINE_ITEMS_MIN_1,
      details: { path: [...path, "items"] },
    });
  }

  if (typeof cell.collapsible !== "boolean") {
    throw new DomainError({
      code: EC.CELL_TIMELINE_COLLAPSIBLE_INVALID,
      message: EC.CELL_TIMELINE_COLLAPSIBLE_INVALID,
      details: { path: [...path, "collapsible"] },
    });
  }

  for (let i = 0; i < cell.items.length; i++) {
    assertTimelineItem(cell.items[i], [...path, "items", i]);
  }
}

function assertTimelineItem(item: TimelineItem, path: Path) {
  if (!item || typeof item !== "object") {
    throw new DomainError({
      code: EC.CELL_TIMELINE_ITEM_INVALID,
      message: EC.CELL_TIMELINE_ITEM_INVALID,
      details: { path },
    });
  }

  if (typeof item.id !== "string" || !item.id.trim()) {
    throw new DomainError({
      code: EC.CELL_TIMELINE_ITEM_ID_REQUIRED,
      message: EC.CELL_TIMELINE_ITEM_ID_REQUIRED,
      details: { path: [...path, "id"] },
    });
  }

  if (typeof item.period !== "string" || !item.period.trim()) {
    throw new DomainError({
      code: EC.CELL_TIMELINE_ITEM_PERIOD_REQUIRED,
      message: EC.CELL_TIMELINE_ITEM_PERIOD_REQUIRED,
      details: { path: [...path, "period"] },
    });
  }

  if (typeof item.title !== "string" || !item.title.trim()) {
    throw new DomainError({
      code: EC.CELL_TIMELINE_ITEM_TITLE_REQUIRED,
      message: EC.CELL_TIMELINE_ITEM_TITLE_REQUIRED,
      details: { path: [...path, "title"] },
    });
  }

  if (item.subtitle !== null && typeof item.subtitle !== "string") {
    throw new DomainError({
      code: EC.CELL_TIMELINE_ITEM_SUBTITLE_INVALID,
      message: EC.CELL_TIMELINE_ITEM_SUBTITLE_INVALID,
      details: { path: [...path, "subtitle"] },
    });
  }

  if (item.description !== null && typeof item.description !== "string") {
    throw new DomainError({
      code: EC.CELL_TIMELINE_ITEM_DESCRIPTION_INVALID,
      message: EC.CELL_TIMELINE_ITEM_DESCRIPTION_INVALID,
      details: { path: [...path, "description"] },
    });
  }

  if (item.badge !== null && typeof item.badge !== "string") {
    throw new DomainError({
      code: EC.CELL_TIMELINE_ITEM_BADGE_INVALID,
      message: EC.CELL_TIMELINE_ITEM_BADGE_INVALID,
      details: { path: [...path, "badge"] },
    });
  }

  if (!Array.isArray(item.keywords)) {
    throw new DomainError({
      code: EC.CELL_TIMELINE_ITEM_KEYWORDS_INVALID,
      message: EC.CELL_TIMELINE_ITEM_KEYWORDS_INVALID,
      details: { path: [...path, "keywords"] },
    });
  }

  for (let i = 0; i < item.keywords.length; i++) {
    const keyword = item.keywords[i];

    if (typeof keyword !== "string" || !keyword.trim()) {
      throw new DomainError({
        code: EC.CELL_TIMELINE_ITEM_KEYWORD_INVALID,
        message: EC.CELL_TIMELINE_ITEM_KEYWORD_INVALID,
        details: { path: [...path, "keywords", i] },
      });
    }
  }
}
