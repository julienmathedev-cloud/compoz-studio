/**
 * @file apps/studio/src/app/api/_adapters/pages/blocks/cells/testimonials.ts
 * @layer studio/app/api/adapters
 * @description
 * Adapteurs API Studio pour les cellules de type `TestimonialsCell`.
 */

import type {
  TestimonialItem,
  TestimonialsCell,
} from "@compoz/core/domain/pages/entities/cell";
import { trimClearableOrUndef, trimOrKeep } from "@compoz/studio/lib/strings";
import type {
  TestimonialItemIntentDTO,
  TestimonialsCellIntentDTO,
} from "@compoz/validation/pages/blocks/cells/cell-intents";

function adaptTestimonialItem(
  dto: TestimonialItemIntentDTO,
): TestimonialItem {
  return {
    id: trimOrKeep(dto.id),
    quote: trimOrKeep(dto.quote),
    authorName: trimOrKeep(dto.authorName),
    authorRole: trimClearableOrUndef(dto.authorRole),
    authorImage: trimClearableOrUndef(dto.authorImage),
    rating: dto.rating,
  };
}

export function adaptTestimonialsCell(
  dto: TestimonialsCellIntentDTO,
): TestimonialsCell {
  return {
    id: trimOrKeep(dto.id),
    kind: "testimonials",
    cssClassName: trimClearableOrUndef(dto.cssClassName),
    title: trimClearableOrUndef(dto.title),
    description: trimClearableOrUndef(dto.description),
    displayMode: dto.displayMode,
    items: dto.items.map(adaptTestimonialItem),
  };
}
