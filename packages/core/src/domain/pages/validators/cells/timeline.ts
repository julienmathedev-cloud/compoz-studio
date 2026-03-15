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
  if (!Array.isArray(cell.items) || cell.items.length < 1) {
    throw new DomainError({
      code: EC.CELL_INVALID,
      message: EC.CELL_INVALID,
      details: { path: [...path, "items"] },
    });
  }

  for (let i = 0; i < cell.items.length; i++) {
    assertTimelineItem(cell.items[i], [...path, "items", i]);
  }
}

function assertTimelineItem(item: TimelineItem, path: Path) {
  if (!item || typeof item !== "object") {
    throw new DomainError({
      code: EC.CELL_INVALID,
      message: EC.CELL_INVALID,
      details: { path },
    });
  }

  if (typeof item.id !== "string" || !item.id.trim()) {
    throw new DomainError({
      code: EC.CELL_INVALID,
      message: EC.CELL_INVALID,
      details: { path: [...path, "id"] },
    });
  }

  if (typeof item.period !== "string" || !item.period.trim()) {
    throw new DomainError({
      code: EC.CELL_INVALID,
      message: EC.CELL_INVALID,
      details: { path: [...path, "period"] },
    });
  }

  if (typeof item.title !== "string" || !item.title.trim()) {
    throw new DomainError({
      code: EC.CELL_INVALID,
      message: EC.CELL_INVALID,
      details: { path: [...path, "title"] },
    });
  }

  if (
    typeof item.subtitle !== "undefined" &&
    typeof item.subtitle !== "string"
  ) {
    throw new DomainError({
      code: EC.CELL_INVALID,
      message: EC.CELL_INVALID,
      details: { path: [...path, "subtitle"] },
    });
  }

  if (
    typeof item.description !== "undefined" &&
    typeof item.description !== "string"
  ) {
    throw new DomainError({
      code: EC.CELL_INVALID,
      message: EC.CELL_INVALID,
      details: { path: [...path, "description"] },
    });
  }

  if (typeof item.badge !== "undefined" && typeof item.badge !== "string") {
    throw new DomainError({
      code: EC.CELL_INVALID,
      message: EC.CELL_INVALID,
      details: { path: [...path, "badge"] },
    });
  }

  if (typeof item.keywords !== "undefined") {
    if (!Array.isArray(item.keywords)) {
      throw new DomainError({
        code: EC.CELL_INVALID,
        message: EC.CELL_INVALID,
        details: { path: [...path, "keywords"] },
      });
    }

    for (let i = 0; i < item.keywords.length; i++) {
      const keyword = item.keywords[i];

      if (typeof keyword !== "string" || !keyword.trim()) {
        throw new DomainError({
          code: EC.CELL_INVALID,
          message: EC.CELL_INVALID,
          details: { path: [...path, "keywords", i] },
        });
      }
    }
  }
}
