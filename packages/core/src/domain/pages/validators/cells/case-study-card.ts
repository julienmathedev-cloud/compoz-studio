/**
 * @file packages/core/src/domain/pages/validators/cells/case-study-card.ts
 * @layer core/domain/pages/validators
 * @description
 * Validateur métier de CaseStudyCardCell.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type {
  CaseStudyCardItem,
  Cell,
} from "@compoz/core/domain/pages/entities/cell";
import { assertSingleImageCell } from "@compoz/core/domain/pages/validators/cells/image";

type Path = ReadonlyArray<string | number>;

function throwInvalidCell(path: Path): never {
  throw new DomainError({
    code: EC.CELL_INVALID,
    message: EC.CELL_INVALID,
    details: { path },
  });
}

function assertCaseStudyCardItem(item: CaseStudyCardItem, path: Path) {
  if (typeof item.id !== "string" || !item.id.trim()) {
    throwInvalidCell([...path, "id"]);
  }

  if (typeof item.title !== "string" || !item.title.trim()) {
    throwInvalidCell([...path, "title"]);
  }

  if (typeof item.context !== "string" || !item.context.trim()) {
    throwInvalidCell([...path, "context"]);
  }

  if (typeof item.solution !== "string" || !item.solution.trim()) {
    throwInvalidCell([...path, "solution"]);
  }

  if (typeof item.result !== "string" || !item.result.trim()) {
    throwInvalidCell([...path, "result"]);
  }

  if (typeof item.image !== "undefined") {
    assertSingleImageCell(
      {
        id: item.id,
        kind: "image",
        image: item.image,
      },
      [...path, "image"],
    );
  }
}

export function assertCaseStudyCardCell(
  cell: Extract<Cell, { kind: "caseStudyCard" }>,
  path: Path,
) {
  if (cell.columns !== 1 && cell.columns !== 2 && cell.columns !== 3) {
    throwInvalidCell([...path, "columns"]);
  }

  if (!Array.isArray(cell.items) || cell.items.length < 1) {
    throwInvalidCell([...path, "items"]);
  }

  cell.items.forEach((item, index) => {
    assertCaseStudyCardItem(item, [...path, "items", index]);
  });
}
