/**
 * @file packages/core/src/domain/pages/validators/cells/heading.ts
 * @layer core/domain/pages/validators
 * @description
 * Validateurs métier de HeadingCell.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type {
  Cell,
  HeadingCell,
} from "@compoz/core/domain/pages/entities/cell";

type Path = ReadonlyArray<string | number>;

const HEADING_LEVELS = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;
const HEADING_ALIGNS = ["left", "center"] as const;
const HEADING_VARIANTS = ["default", "hero"] as const;
const HEADING_ANCHOR_ID_RE = /^[A-Za-z0-9_-]+$/;

export function assertHeadingCell(
  cell: Extract<Cell, { kind: "heading" }>,
  path: Path,
) {
  if (!HEADING_LEVELS.includes(cell.level)) {
    throw new DomainError({
      code: EC.CELL_HEADING_LEVEL_INVALID,
      message: EC.CELL_HEADING_LEVEL_INVALID,
      details: { path: [...path, "level"], meta: { level: cell.level } },
    });
  }

  if (typeof cell.title !== "string" || !cell.title.trim()) {
    throw new DomainError({
      code: EC.CELL_HEADING_TITLE_REQUIRED,
      message: EC.CELL_HEADING_TITLE_REQUIRED,
      details: { path: [...path, "title"] },
    });
  }

  if (
    typeof cell.subtitle !== "undefined" &&
    typeof cell.subtitle !== "string"
  ) {
    throw new DomainError({
      code: EC.CELL_HEADING_SUBTITLE_INVALID,
      message: EC.CELL_HEADING_SUBTITLE_INVALID,
      details: { path: [...path, "subtitle"] },
    });
  }

  if (
    typeof cell.align !== "undefined" &&
    !HEADING_ALIGNS.includes(cell.align)
  ) {
    throw new DomainError({
      code: EC.CELL_HEADING_ALIGN_INVALID,
      message: EC.CELL_HEADING_ALIGN_INVALID,
      details: { path: [...path, "align"], meta: { align: cell.align } },
    });
  }

  if (
    typeof cell.variant !== "undefined" &&
    !HEADING_VARIANTS.includes(cell.variant)
  ) {
    throw new DomainError({
      code: EC.CELL_HEADING_VARIANT_INVALID,
      message: EC.CELL_HEADING_VARIANT_INVALID,
      details: { path: [...path, "variant"], meta: { variant: cell.variant } },
    });
  }

  if (
    typeof cell.separator !== "undefined" &&
    typeof cell.separator !== "boolean"
  ) {
    throw new DomainError({
      code: EC.CELL_HEADING_SEPARATOR_INVALID,
      message: EC.CELL_HEADING_SEPARATOR_INVALID,
      details: {
        path: [...path, "separator"],
        meta: { separator: cell.separator },
      },
    });
  }

  if (typeof cell.idAnchor !== "undefined") {
    if (typeof cell.idAnchor !== "string") {
      throw new DomainError({
        code: EC.CELL_HEADING_ID_ANCHOR_INVALID,
        message: EC.CELL_HEADING_ID_ANCHOR_INVALID,
        details: {
          path: [...path, "idAnchor"],
          meta: { idAnchor: cell.idAnchor },
        },
      });
    }

    const normalizedIdAnchor = cell.idAnchor.trim();

    if (
      normalizedIdAnchor.length > 0 &&
      !HEADING_ANCHOR_ID_RE.test(normalizedIdAnchor)
    ) {
      throw new DomainError({
        code: EC.CELL_HEADING_ID_ANCHOR_INVALID,
        message: EC.CELL_HEADING_ID_ANCHOR_INVALID,
        details: {
          path: [...path, "idAnchor"],
          meta: { idAnchor: cell.idAnchor },
        },
      });
    }
  }

  if (typeof cell.reveal !== "undefined" && typeof cell.reveal !== "boolean") {
    throw new DomainError({
      code: EC.CELL_HEADING_REVEAL_INVALID,
      message: EC.CELL_HEADING_REVEAL_INVALID,
      details: {
        path: [...path, "reveal"],
        meta: { reveal: cell.reveal },
      },
    });
  }

  if (typeof cell.highlights !== "undefined") {
    if (!Array.isArray(cell.highlights)) {
      throw new DomainError({
        code: EC.CELL_HEADING_HIGHLIGHTS_INVALID,
        message: EC.CELL_HEADING_HIGHLIGHTS_INVALID,
        details: { path: [...path, "highlights"] },
      });
    }

    for (let i = 0; i < cell.highlights.length; i++) {
      const highlight = cell.highlights[i];

      if (typeof highlight !== "string" || !highlight.trim()) {
        throw new DomainError({
          code: EC.CELL_HEADING_HIGHLIGHT_INVALID,
          message: EC.CELL_HEADING_HIGHLIGHT_INVALID,
          details: { path: [...path, "highlights", i] },
        });
      }
    }
  }
}

type HeadingLikeCell = Readonly<{
  kind: string;
  level?: string;
}>;

export function hasUniqueHeadingH1(cells: readonly HeadingLikeCell[]): boolean {
  const h1Count = cells.filter(
    (cell) => cell.kind === "heading" && cell.level === "h1",
  ).length;

  return h1Count <= 1;
}

export function validateUniqueHeadingH1(
  cells: readonly HeadingLikeCell[],
  path: Path = ["cells"],
): void {
  if (!hasUniqueHeadingH1(cells)) {
    throw new DomainError({
      code: EC.HEADING_CELL_UNIQUE_H1,
      message: EC.HEADING_CELL_UNIQUE_H1,
      details: { path },
    });
  }
}

export function isHeadingH1Cell(cell: HeadingLikeCell): cell is HeadingCell {
  return cell.kind === "heading" && cell.level === "h1";
}
