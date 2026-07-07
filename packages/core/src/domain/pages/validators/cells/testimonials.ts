/**
 * @file packages/core/src/domain/pages/validators/cells/testimonials.ts
 * @layer core/domain/pages/validators
 * @description Domain validator for testimonials cells.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type {
  Cell,
  TestimonialItem,
} from "@compoz/core/domain/pages/entities/cell";

type Path = ReadonlyArray<string | number>;

const TESTIMONIAL_RATINGS = [1, 2, 3, 4, 5] as const;

function isTestimonialRating(
  value: unknown,
): value is (typeof TESTIMONIAL_RATINGS)[number] {
  return (
    typeof value === "number" &&
    TESTIMONIAL_RATINGS.includes(value as (typeof TESTIMONIAL_RATINGS)[number])
  );
}

export function assertTestimonialsCell(
  cell: Extract<Cell, { kind: "testimonials" }>,
  path: Path,
): void {
  if (cell.displayMode !== "static" && cell.displayMode !== "marquee") {
    throw new DomainError({
      code: EC.CELL_TESTIMONIALS_DISPLAY_MODE_INVALID,
      message: EC.CELL_TESTIMONIALS_DISPLAY_MODE_INVALID,
      details: {
        path: [...path, "displayMode"],
        meta: { displayMode: cell.displayMode },
      },
    });
  }

  if (cell.title !== undefined && typeof cell.title !== "string") {
    throw new DomainError({
      code: EC.CELL_TESTIMONIALS_TITLE_INVALID,
      message: EC.CELL_TESTIMONIALS_TITLE_INVALID,
      details: {
        path: [...path, "title"],
        meta: { title: cell.title },
      },
    });
  }

  if (cell.description !== undefined && typeof cell.description !== "string") {
    throw new DomainError({
      code: EC.CELL_TESTIMONIALS_DESCRIPTION_INVALID,
      message: EC.CELL_TESTIMONIALS_DESCRIPTION_INVALID,
      details: {
        path: [...path, "description"],
        meta: { description: cell.description },
      },
    });
  }

  if (!Array.isArray(cell.items)) {
    throw new DomainError({
      code: EC.CELL_TESTIMONIALS_ITEMS_INVALID,
      message: EC.CELL_TESTIMONIALS_ITEMS_INVALID,
      details: { path: [...path, "items"] },
    });
  }

  if (cell.items.length < 1) {
    throw new DomainError({
      code: EC.CELL_TESTIMONIALS_ITEMS_MIN_1,
      message: EC.CELL_TESTIMONIALS_ITEMS_MIN_1,
      details: { path: [...path, "items"] },
    });
  }

  cell.items.forEach((item, index) => {
    assertTestimonialItem(item, [...path, "items", index]);
  });
}

function assertTestimonialItem(item: TestimonialItem, path: Path): void {
  if (!item || typeof item !== "object") {
    throw new DomainError({
      code: EC.CELL_TESTIMONIAL_ITEM_INVALID,
      message: EC.CELL_TESTIMONIAL_ITEM_INVALID,
      details: { path },
    });
  }

  if (typeof item.id !== "string" || !item.id.trim()) {
    throw new DomainError({
      code: EC.CELL_TESTIMONIAL_ITEM_ID_REQUIRED,
      message: EC.CELL_TESTIMONIAL_ITEM_ID_REQUIRED,
      details: { path: [...path, "id"] },
    });
  }

  if (typeof item.quote !== "string" || !item.quote.trim()) {
    throw new DomainError({
      code: EC.CELL_TESTIMONIAL_ITEM_QUOTE_REQUIRED,
      message: EC.CELL_TESTIMONIAL_ITEM_QUOTE_REQUIRED,
      details: { path: [...path, "quote"] },
    });
  }

  if (typeof item.authorName !== "string" || !item.authorName.trim()) {
    throw new DomainError({
      code: EC.CELL_TESTIMONIAL_ITEM_AUTHOR_NAME_REQUIRED,
      message: EC.CELL_TESTIMONIAL_ITEM_AUTHOR_NAME_REQUIRED,
      details: { path: [...path, "authorName"] },
    });
  }

  if (item.authorRole !== undefined && typeof item.authorRole !== "string") {
    throw new DomainError({
      code: EC.CELL_TESTIMONIAL_ITEM_AUTHOR_ROLE_INVALID,
      message: EC.CELL_TESTIMONIAL_ITEM_AUTHOR_ROLE_INVALID,
      details: {
        path: [...path, "authorRole"],
        meta: { authorRole: item.authorRole },
      },
    });
  }

  if (item.authorImage !== undefined && typeof item.authorImage !== "string") {
    throw new DomainError({
      code: EC.CELL_TESTIMONIAL_ITEM_AUTHOR_IMAGE_INVALID,
      message: EC.CELL_TESTIMONIAL_ITEM_AUTHOR_IMAGE_INVALID,
      details: {
        path: [...path, "authorImage"],
        meta: { authorImage: item.authorImage },
      },
    });
  }

  if (item.rating !== undefined && !isTestimonialRating(item.rating)) {
    throw new DomainError({
      code: EC.CELL_TESTIMONIAL_ITEM_RATING_INVALID,
      message: EC.CELL_TESTIMONIAL_ITEM_RATING_INVALID,
      details: { path: [...path, "rating"], meta: { rating: item.rating } },
    });
  }
}
