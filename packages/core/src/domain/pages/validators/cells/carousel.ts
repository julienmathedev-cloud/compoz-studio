/**
 * @file packages/core/src/domain/pages/validators/cells/carousel.ts
 * @layer core/domain/pages/validators
 * @description
 * Validateur métier de CarouselCell.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type {
  CarouselItem,
  CarouselItemKind,
  Cell,
} from "@compoz/core/domain/pages/entities/cell";
import { assertImageEditor } from "@compoz/core/domain/pages/validators/cells/shared-image";

type Path = ReadonlyArray<string | number>;

function throwInvalidCell(path: Path): never {
  throw new DomainError({
    code: EC.CELL_INVALID,
    message: EC.CELL_INVALID,
    details: { path },
  });
}

function assertCarouselVariant(value: unknown, path: Path) {
  if (value !== "carousel" && value !== "slider") {
    throwInvalidCell(path);
  }
}

function assertCarouselItemKind(
  value: unknown,
  path: Path,
): asserts value is CarouselItemKind {
  if (
    value !== "image" &&
    value !== "card" &&
    value !== "cardsExtended" &&
    value !== "caseStudyCard"
  ) {
    throwInvalidCell(path);
  }
}

function assertCarouselImageItem(item: unknown, path: Path) {
  assertImageEditor(item, path);
}

function assertCarouselCardItem(item: unknown, path: Path) {
  if (!item || typeof item !== "object") {
    throwInvalidCell(path);
  }

  const candidate = item as {
    id?: unknown;
    title?: unknown;
    description?: unknown;
    icon?: unknown;
  };

  if (typeof candidate.id !== "string" || !candidate.id.trim()) {
    throwInvalidCell([...path, "id"]);
  }

  if (typeof candidate.title !== "string" || !candidate.title.trim()) {
    throwInvalidCell([...path, "title"]);
  }

  if (
    typeof candidate.description !== "string" ||
    !candidate.description.trim()
  ) {
    throwInvalidCell([...path, "description"]);
  }

  if (
    typeof candidate.icon !== "undefined" &&
    typeof candidate.icon !== "string"
  ) {
    throwInvalidCell([...path, "icon"]);
  }
}

function assertCarouselCardsExtendedItem(item: unknown, path: Path) {
  if (!item || typeof item !== "object") {
    throwInvalidCell(path);
  }

  const candidate = item as {
    id?: unknown;
    title?: unknown;
    description?: unknown;
    bullets?: unknown;
    footer?: unknown;
    icon?: unknown;
  };

  if (typeof candidate.id !== "string" || !candidate.id.trim()) {
    throwInvalidCell([...path, "id"]);
  }

  if (typeof candidate.title !== "string" || !candidate.title.trim()) {
    throwInvalidCell([...path, "title"]);
  }

  if (
    typeof candidate.description !== "string" ||
    !candidate.description.trim()
  ) {
    throwInvalidCell([...path, "description"]);
  }

  if (!Array.isArray(candidate.bullets)) {
    throwInvalidCell([...path, "bullets"]);
  }

  for (let index = 0; index < candidate.bullets.length; index += 1) {
    const bullet = candidate.bullets[index];

    if (typeof bullet !== "string" || !bullet.trim()) {
      throwInvalidCell([...path, "bullets", index]);
    }
  }

  if (
    typeof candidate.footer !== "undefined" &&
    typeof candidate.footer !== "string"
  ) {
    throwInvalidCell([...path, "footer"]);
  }

  if (
    typeof candidate.icon !== "undefined" &&
    typeof candidate.icon !== "string"
  ) {
    throwInvalidCell([...path, "icon"]);
  }
}

function assertCarouselCaseStudyCardItem(item: unknown, path: Path) {
  if (!item || typeof item !== "object") {
    throwInvalidCell(path);
  }

  const candidate = item as {
    id?: unknown;
    image?: unknown;
    title?: unknown;
    context?: unknown;
    solution?: unknown;
    result?: unknown;
  };

  if (typeof candidate.id !== "string" || !candidate.id.trim()) {
    throwInvalidCell([...path, "id"]);
  }

  if (typeof candidate.title !== "string" || !candidate.title.trim()) {
    throwInvalidCell([...path, "title"]);
  }

  if (typeof candidate.context !== "string" || !candidate.context.trim()) {
    throwInvalidCell([...path, "context"]);
  }

  if (typeof candidate.solution !== "string" || !candidate.solution.trim()) {
    throwInvalidCell([...path, "solution"]);
  }

  if (typeof candidate.result !== "string" || !candidate.result.trim()) {
    throwInvalidCell([...path, "result"]);
  }

  if (typeof candidate.image !== "undefined") {
    assertImageEditor(candidate.image, [...path, "image"]);
  }
}

function assertCarouselItemByKind(
  item: CarouselItem,
  itemKind: CarouselItemKind,
  path: Path,
) {
  switch (itemKind) {
    case "image":
      assertCarouselImageItem(item, path);
      return;

    case "card":
      assertCarouselCardItem(item, path);
      return;

    case "cardsExtended":
      assertCarouselCardsExtendedItem(item, path);
      return;

    case "caseStudyCard":
      assertCarouselCaseStudyCardItem(item, path);
      return;

    default:
      throwInvalidCell(path);
  }
}

export function assertCarouselCell(
  cell: Extract<Cell, { kind: "carousel" }>,
  path: Path,
) {
  assertCarouselVariant(cell.variant, [...path, "variant"]);

  if (typeof cell.showDots !== "boolean") {
    throwInvalidCell([...path, "showDots"]);
  }

  if (typeof cell.showArrows !== "boolean") {
    throwInvalidCell([...path, "showArrows"]);
  }

  assertCarouselItemKind(cell.itemKind, [...path, "itemKind"]);

  if (!Array.isArray(cell.items) || cell.items.length < 1) {
    throwInvalidCell([...path, "items"]);
  }

  cell.items.forEach((item, index) => {
    assertCarouselItemByKind(item, cell.itemKind, [...path, "items", index]);
  });
}
