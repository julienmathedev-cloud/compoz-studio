/**
 * @file packages/core/src/domain/pages/validators/cells/rich-text.ts
 * @layer core/domain/pages/validators
 * @description
 * Validateur métier de RichTextCell.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { Cell } from "@compoz/core/domain/pages/entities/cell";

type Path = ReadonlyArray<string | number>;

export function assertRichText(
  cell: Extract<Cell, { kind: "richText" }>,
  path: Path,
) {
  if (typeof cell.content !== "string") {
    throw new DomainError({
      code: EC.RICH_TEXT_CONTENT_INVALID,
      message: EC.RICH_TEXT_CONTENT_INVALID,
      details: { path: [...path, "content"] },
    });
  }

  if (typeof cell.reveal !== "boolean") {
    throw new DomainError({
      code: EC.RICH_TEXT_REVEAL_INVALID,
      message: EC.RICH_TEXT_REVEAL_INVALID,
      details: {
        path: [...path, "reveal"],
        meta: { reveal: cell.reveal },
      },
    });
  }
}
