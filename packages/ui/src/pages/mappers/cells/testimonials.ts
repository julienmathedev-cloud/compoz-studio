/**
 * @file packages/ui/src/pages/mappers/cells/testimonials.ts
 * @layer ui/pages/mappers
 * @description Maps testimonials cell DTOs to form values.
 */

import type { CellDTO } from "@compoz/core/domain/pages/dto";
import type { TestimonialsCellFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

export function toTestimonialsCellShapeFromDTO(
  cell: Extract<CellDTO, { kind: "testimonials" }>,
): TestimonialsCellFormValues {
  return {
    id: cell.id,
    kind: "testimonials",
    cssClassName: cell.cssClassName,
    title: cell.title,
    description: cell.description,
    displayMode: cell.displayMode,
    items: cell.items.map((item) => ({
      id: item.id,
      quote: item.quote,
      authorName: item.authorName,
      authorRole: item.authorRole,
      authorImage: item.authorImage,
      rating: item.rating,
    })),
  };
}
