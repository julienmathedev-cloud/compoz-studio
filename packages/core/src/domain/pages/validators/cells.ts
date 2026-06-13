/**
 * @file packages/core/src/domain/pages/validators/cells.ts
 * @layer core/domain/pages/validators
 * @description
 * Validations métier **pures** pour les cellules d’une page (V0.5).
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { Cell } from "@compoz/core/domain/pages/entities/cell";
import { assertButtonsCell } from "@compoz/core/domain/pages/validators/cells/button";
import { assertCardsCell } from "@compoz/core/domain/pages/validators/cells/card";
import { assertCardCollectionCell } from "@compoz/core/domain/pages/validators/cells/card-collection";
import { assertCardsExtendedCell } from "@compoz/core/domain/pages/validators/cells/card-extended";
import { assertCarouselCell } from "@compoz/core/domain/pages/validators/cells/carousel";
import { assertFormCell } from "@compoz/core/domain/pages/validators/cells/form";
import {
  assertGalleryMaxColumns,
  assertMultiImageCell,
} from "@compoz/core/domain/pages/validators/cells/gallery";
import {
  assertHeadingCell,
  hasUniqueHeadingH1,
  isHeadingH1Cell,
  validateUniqueHeadingH1,
} from "@compoz/core/domain/pages/validators/cells/heading";
import { assertSingleImageCell } from "@compoz/core/domain/pages/validators/cells/image";
import { assertRichText } from "@compoz/core/domain/pages/validators/cells/rich-text";
import { assertSeparatorCell } from "@compoz/core/domain/pages/validators/cells/separator";
import { assertSpacerCell } from "@compoz/core/domain/pages/validators/cells/spacer";
import { assertStepsCell } from "@compoz/core/domain/pages/validators/cells/step";
import { assertStructuredCardCell } from "@compoz/core/domain/pages/validators/cells/structured-card";
import { assertTimelineCell } from "@compoz/core/domain/pages/validators/cells/timeline";

type Path = ReadonlyArray<string | number>;

export function assertCell(cell: Cell, path: Path): void {
  if (!cell || typeof cell !== "object") {
    throw new DomainError({
      code: EC.CELL_SHAPE_INVALID,
      message: EC.CELL_SHAPE_INVALID,
      details: { path },
    });
  }

  if (typeof cell.id !== "string" || !cell.id.trim()) {
    throw new DomainError({
      code: EC.CELL_ID_REQUIRED,
      message: EC.CELL_ID_REQUIRED,
      details: { path: [...path, "id"] },
    });
  }

  const kind = cell.kind;

  switch (kind) {
    case "heading":
      assertHeadingCell(cell, path);
      return;

    case "richText":
      assertRichText(cell, path);
      return;

    case "spacer":
      assertSpacerCell(cell, path);
      return;

    case "separator":
      assertSeparatorCell(cell, path);
      return;

    case "buttons":
      assertButtonsCell(cell, path);
      return;

    case "cards":
      assertCardsCell(cell, path);
      return;

    case "cardCollection":
      assertCardCollectionCell(cell, path);
      return;

    case "cardsExtended":
      assertCardsExtendedCell(cell, path);
      return;

    case "steps":
      assertStepsCell(cell, path);
      return;

    case "timeline":
      assertTimelineCell(cell, path);
      return;

    case "structuredCard":
      assertStructuredCardCell(cell, path);
      return;

    case "form":
      assertFormCell(cell, path);
      return;

    case "image":
      assertSingleImageCell(cell, path);
      return;

    case "gallery":
      assertMultiImageCell(cell.items, path);
      assertGalleryMaxColumns(cell.maxColumns, path);
      return;

    case "carousel":
      assertCarouselCell(cell, path);
      return;

    default:
      throw new DomainError({
        code: EC.CELL_KIND_UNSUPPORTED,
        message: EC.CELL_KIND_UNSUPPORTED,
        details: { path: [...path, "kind"], meta: { kind } },
      });
  }
}

export { hasUniqueHeadingH1, isHeadingH1Cell, validateUniqueHeadingH1 };
