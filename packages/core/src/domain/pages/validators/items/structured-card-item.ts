/**
 * @file packages/core/src/domain/pages/validators/items/structured-card-item.ts
 * @layer core/domain/pages/validators
 *
 * @description
 * Validateurs métier d’un item de carte structurée.
 *
 * @remarks
 * Cet item est utilisé par des cellules de plus haut niveau comme
 * `cardCollection` ou `carousel`.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type {
  StructuredCardItem,
  StructuredCardSection,
} from "@compoz/core/domain/pages/entities/cell";
import { assertButtonItem } from "@compoz/core/domain/pages/validators/cells/button";
import { assertImageEditor } from "@compoz/core/domain/pages/validators/cells/shared-image";

type Path = ReadonlyArray<string | number>;

export function assertStructuredCardSection(
  section: StructuredCardSection,
  path: Path,
) {
  if (!section || typeof section !== "object") {
    throw new DomainError({
      code: EC.CELL_STRUCTURED_CARD_SECTION_INVALID,
      message: EC.CELL_STRUCTURED_CARD_SECTION_INVALID,
      details: { path },
    });
  }

  if (typeof section.id !== "string" || !section.id.trim()) {
    throw new DomainError({
      code: EC.CELL_STRUCTURED_CARD_SECTION_ID_REQUIRED,
      message: EC.CELL_STRUCTURED_CARD_SECTION_ID_REQUIRED,
      details: { path: [...path, "id"] },
    });
  }

  if (typeof section.label !== "string" || !section.label.trim()) {
    throw new DomainError({
      code: EC.CELL_STRUCTURED_CARD_SECTION_LABEL_REQUIRED,
      message: EC.CELL_STRUCTURED_CARD_SECTION_LABEL_REQUIRED,
      details: { path: [...path, "label"] },
    });
  }

  if (typeof section.content !== "string" || !section.content.trim()) {
    throw new DomainError({
      code: EC.CELL_STRUCTURED_CARD_SECTION_CONTENT_REQUIRED,
      message: EC.CELL_STRUCTURED_CARD_SECTION_CONTENT_REQUIRED,
      details: { path: [...path, "content"] },
    });
  }
}

export function assertStructuredCardItem(item: StructuredCardItem, path: Path) {
  if (!item || typeof item !== "object") {
    throw new DomainError({
      code: EC.CELL_STRUCTURED_CARD_ITEM_INVALID,
      message: EC.CELL_STRUCTURED_CARD_ITEM_INVALID,
      details: { path },
    });
  }

  if (typeof item.id !== "string" || !item.id.trim()) {
    throw new DomainError({
      code: EC.CELL_STRUCTURED_CARD_ITEM_ID_REQUIRED,
      message: EC.CELL_STRUCTURED_CARD_ITEM_ID_REQUIRED,
      details: { path: [...path, "id"] },
    });
  }

  if (typeof item.title !== "string" || !item.title.trim()) {
    throw new DomainError({
      code: EC.CELL_STRUCTURED_CARD_ITEM_TITLE_REQUIRED,
      message: EC.CELL_STRUCTURED_CARD_ITEM_TITLE_REQUIRED,
      details: { path: [...path, "title"] },
    });
  }

  if (item.meta !== null && typeof item.meta !== "string") {
    throw new DomainError({
      code: EC.CELL_STRUCTURED_CARD_ITEM_META_INVALID,
      message: EC.CELL_STRUCTURED_CARD_ITEM_META_INVALID,
      details: { path: [...path, "meta"] },
    });
  }

  if (!Array.isArray(item.sections)) {
    throw new DomainError({
      code: EC.CELL_STRUCTURED_CARD_ITEM_SECTIONS_INVALID,
      message: EC.CELL_STRUCTURED_CARD_ITEM_SECTIONS_INVALID,
      details: { path: [...path, "sections"] },
    });
  }

  if (item.sections.length < 1) {
    throw new DomainError({
      code: EC.CELL_STRUCTURED_CARD_ITEM_SECTIONS_MIN_1,
      message: EC.CELL_STRUCTURED_CARD_ITEM_SECTIONS_MIN_1,
      details: { path: [...path, "sections"] },
    });
  }

  item.sections.forEach((section, index) => {
    assertStructuredCardSection(section, [...path, "sections", index]);
  });

  if (item.image !== null) {
    assertImageEditor(item.image, [...path, "image"]);
  }

  if (item.button !== null) {
    assertButtonItem(item.button, [...path, "button"]);
  }
}
