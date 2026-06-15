/**
 * @file packages/core/src/domain/pages/entities/cells/testimonials.ts
 * @layer core/domain/pages
 * @description
 * Entité métier TestimonialsCell.
 */

export type TestimonialsDisplayMode = "static" | "marquee";

export type TestimonialRating = 1 | 2 | 3 | 4 | 5;

export type TestimonialItem = {
  id: string;
  quote: string;
  authorName: string;
  authorRole?: string;
  authorImage?: string;
  rating?: TestimonialRating;
};

export type TestimonialsCell = {
  id: string;
  kind: "testimonials";
  cssClassName?: string;
  title?: string;
  description?: string;
  displayMode: TestimonialsDisplayMode;
  items: ReadonlyArray<TestimonialItem>;
};
