/**
 * @file packages/validation/src/pages/blocks/cells/cell.ts
 * @layer validation/pages/blocks/cells
 *
 * @description
 * Zod schemas describing the boundary shape of cells used by API and infra layers.
 */

import { z } from "zod";

import type {
  ButtonIconPositionSchema,
  ButtonItemSchema,
  ButtonPresentationSchema,
} from "@compoz/validation/pages/blocks/cells/details/buttons";
import { ButtonsCellSchema } from "@compoz/validation/pages/blocks/cells/details/buttons";
import type {
  CardCollectionAlignSchema,
  CardCollectionCardColumnsSchema,
  CardCollectionCardKindSchema,
  CardCollectionColumnsSchema,
  CardCollectionItemSchema,
  CardCollectionStackedColumnsSchema,
} from "@compoz/validation/pages/blocks/cells/details/card-collection";
import { CardCollectionCellSchema } from "@compoz/validation/pages/blocks/cells/details/card-collection";
import type {
  CarouselItemKindSchema,
  CarouselItemSchema,
  CarouselVariantSchema,
} from "@compoz/validation/pages/blocks/cells/details/carousel";
import { CarouselCellSchema } from "@compoz/validation/pages/blocks/cells/details/carousel";
import type {
  FormButtonVariantSchema,
  FormFieldSchema,
  FormFieldTypeSchema,
  FormSubmitButtonSchema,
} from "@compoz/validation/pages/blocks/cells/details/form";
import { FormCellSchema } from "@compoz/validation/pages/blocks/cells/details/form";
import { GalleryCellSchema } from "@compoz/validation/pages/blocks/cells/details/gallery";
import { HeadingCellSchema } from "@compoz/validation/pages/blocks/cells/details/heading";
import type { ImageEditorSchema } from "@compoz/validation/pages/blocks/cells/details/image-editor";
import { ImageCellSchema } from "@compoz/validation/pages/blocks/cells/details/image-editor";
import { RichTextCellSchema } from "@compoz/validation/pages/blocks/cells/details/rich-text";
import { SeparatorCellSchema } from "@compoz/validation/pages/blocks/cells/details/separator";
import { SpacerCellSchema } from "@compoz/validation/pages/blocks/cells/details/spacer";
import type { StepItemSchema } from "@compoz/validation/pages/blocks/cells/details/steps";
import { StepsCellSchema } from "@compoz/validation/pages/blocks/cells/details/steps";
import type {
  TestimonialItemSchema,
  TestimonialRatingSchema,
  TestimonialsDisplayModeSchema,
} from "@compoz/validation/pages/blocks/cells/details/testimonials";
import { TestimonialsCellSchema } from "@compoz/validation/pages/blocks/cells/details/testimonials";
import type {
  TimelineItemSchema,
  TimelineKeywordSchema,
} from "@compoz/validation/pages/blocks/cells/details/timeline";
import { TimelineCellSchema } from "@compoz/validation/pages/blocks/cells/details/timeline";
import type { CardItemSchema } from "@compoz/validation/pages/blocks/items/card-item";
import type { ExtendedCardItemSchema } from "@compoz/validation/pages/blocks/items/extended-card-item";
import type {
  StructuredCardItemSchema,
  StructuredCardSectionSchema,
} from "@compoz/validation/pages/blocks/items/structured-card-item";

export const CellSchema = z.discriminatedUnion("kind", [
  HeadingCellSchema,
  RichTextCellSchema,
  SpacerCellSchema,
  SeparatorCellSchema,
  ButtonsCellSchema,
  ImageCellSchema,
  GalleryCellSchema,
  CarouselCellSchema,
  CardCollectionCellSchema,
  StepsCellSchema,
  TestimonialsCellSchema,
  FormCellSchema,
  TimelineCellSchema,
]);

export type HeadingCellInput = z.input<typeof HeadingCellSchema>;
export type HeadingCellOutput = z.output<typeof HeadingCellSchema>;
export type SpacerCellInput = z.input<typeof SpacerCellSchema>;
export type SpacerCellOutput = z.output<typeof SpacerCellSchema>;
export type SeparatorCellInput = z.input<typeof SeparatorCellSchema>;
export type SeparatorCellOutput = z.output<typeof SeparatorCellSchema>;
export type ButtonsCellInput = z.input<typeof ButtonsCellSchema>;
export type ButtonsCellOutput = z.output<typeof ButtonsCellSchema>;
export type CarouselCellInput = z.input<typeof CarouselCellSchema>;
export type CarouselCellOutput = z.output<typeof CarouselCellSchema>;
export type CardCollectionCellInput = z.input<typeof CardCollectionCellSchema>;
export type CardCollectionCellOutput = z.output<
  typeof CardCollectionCellSchema
>;
export type StepsCellInput = z.input<typeof StepsCellSchema>;
export type StepsCellOutput = z.output<typeof StepsCellSchema>;
export type TestimonialsCellInput = z.input<typeof TestimonialsCellSchema>;
export type TestimonialsCellOutput = z.output<typeof TestimonialsCellSchema>;
export type FormCellInput = z.input<typeof FormCellSchema>;
export type FormCellOutput = z.output<typeof FormCellSchema>;
export type TimelineCellInput = z.input<typeof TimelineCellSchema>;
export type TimelineCellOutput = z.output<typeof TimelineCellSchema>;

export type CellShape = z.infer<typeof CellSchema>;
export type HeadingCellShape = z.infer<typeof HeadingCellSchema>;
export type RichTextCellShape = z.infer<typeof RichTextCellSchema>;
export type SpacerCellShape = z.infer<typeof SpacerCellSchema>;
export type SeparatorCellShape = z.infer<typeof SeparatorCellSchema>;
export type ButtonItemShape = z.infer<typeof ButtonItemSchema>;
export type ButtonIconPositionShape = z.infer<typeof ButtonIconPositionSchema>;
export type ButtonPresentationShape = z.infer<typeof ButtonPresentationSchema>;
export type ButtonsCellShape = z.infer<typeof ButtonsCellSchema>;
export type CardItemShape = z.infer<typeof CardItemSchema>;
export type ExtendedCardItemShape = z.infer<typeof ExtendedCardItemSchema>;
export type CarouselVariantShape = z.infer<typeof CarouselVariantSchema>;
export type CarouselItemKindShape = z.infer<typeof CarouselItemKindSchema>;
export type CarouselItemShape = z.infer<typeof CarouselItemSchema>;
export type CarouselCellShape = z.infer<typeof CarouselCellSchema>;
export type CardCollectionCardKindShape = z.infer<
  typeof CardCollectionCardKindSchema
>;
export type CardCollectionCardColumnsShape = z.infer<
  typeof CardCollectionCardColumnsSchema
>;
export type CardCollectionStackedColumnsShape = z.infer<
  typeof CardCollectionStackedColumnsSchema
>;
export type CardCollectionColumnsShape = z.infer<
  typeof CardCollectionColumnsSchema
>;
export type CardCollectionAlignShape = z.infer<
  typeof CardCollectionAlignSchema
>;
export type CardCollectionItemShape = z.infer<typeof CardCollectionItemSchema>;
export type CardCollectionCellShape = z.infer<typeof CardCollectionCellSchema>;
export type StepItemShape = z.infer<typeof StepItemSchema>;
export type StepsCellShape = z.infer<typeof StepsCellSchema>;
export type TestimonialsDisplayModeShape = z.infer<
  typeof TestimonialsDisplayModeSchema
>;
export type TestimonialRatingShape = z.infer<typeof TestimonialRatingSchema>;
export type TestimonialItemShape = z.infer<typeof TestimonialItemSchema>;
export type TestimonialsCellShape = z.infer<typeof TestimonialsCellSchema>;
export type StructuredCardSectionShape = z.infer<
  typeof StructuredCardSectionSchema
>;
export type StructuredCardItemShape = z.infer<typeof StructuredCardItemSchema>;
export type FormFieldTypeShape = z.infer<typeof FormFieldTypeSchema>;
export type FormButtonVariantShape = z.infer<typeof FormButtonVariantSchema>;
export type FormSubmitButtonShape = z.infer<typeof FormSubmitButtonSchema>;
export type FormFieldShape = z.infer<typeof FormFieldSchema>;
export type FormCellShape = z.infer<typeof FormCellSchema>;
export type TimelineKeywordShape = z.infer<typeof TimelineKeywordSchema>;
export type TimelineItemShape = z.infer<typeof TimelineItemSchema>;
export type TimelineCellShape = z.infer<typeof TimelineCellSchema>;
export type ImageCellShape = z.infer<typeof ImageCellSchema>;
export type GalleryCellShape = z.infer<typeof GalleryCellSchema>;
export type ImageEditorShape = z.infer<typeof ImageEditorSchema>;

export {
  ButtonIconPositionSchema,
  ButtonItemSchema,
  ButtonItemVariantSchema,
  ButtonPresentationSchema,
  ButtonsCellSchema,
} from "@compoz/validation/pages/blocks/cells/details/buttons";

export {
  CardCollectionAlignSchema,
  CardCollectionCardColumnsSchema,
  CardCollectionCardKindSchema,
  CardCollectionCellSchema,
  CardCollectionColumnsSchema,
  CardCollectionItemSchema,
  CardCollectionStackedColumnsSchema,
} from "@compoz/validation/pages/blocks/cells/details/card-collection";

export { CardItemSchema } from "@compoz/validation/pages/blocks/items/card-item";

export {
  ExtendedCardBulletSchema,
  ExtendedCardItemSchema,
} from "@compoz/validation/pages/blocks/items/extended-card-item";

export {
  StructuredCardItemSchema,
  StructuredCardSectionSchema,
} from "@compoz/validation/pages/blocks/items/structured-card-item";

export {
  CarouselCellSchema,
  CarouselItemKindSchema,
  CarouselItemSchema,
  CarouselVariantSchema,
} from "@compoz/validation/pages/blocks/cells/details/carousel";

export {
  FormButtonVariantSchema,
  FormCellSchema,
  FormFieldSchema,
  FormFieldTypeSchema,
  FormSubmitButtonSchema,
} from "@compoz/validation/pages/blocks/cells/details/form";

export {
  GalleryCellSchema,
  GalleryMaxColumnsSchema,
} from "@compoz/validation/pages/blocks/cells/details/gallery";

export { HeadingCellSchema } from "@compoz/validation/pages/blocks/cells/details/heading";

export {
  ImageCellSchema,
  ImageEditorSchema,
  ImageVariantSchema,
} from "@compoz/validation/pages/blocks/cells/details/image-editor";

export { RichTextCellSchema } from "@compoz/validation/pages/blocks/cells/details/rich-text";
export { SeparatorCellSchema } from "@compoz/validation/pages/blocks/cells/details/separator";
export { SpacerCellSchema } from "@compoz/validation/pages/blocks/cells/details/spacer";

export {
  StepItemSchema,
  StepsCellSchema,
  StepsVariantSchema,
} from "@compoz/validation/pages/blocks/cells/details/steps";

export {
  TestimonialItemSchema,
  TestimonialRatingSchema,
  TestimonialsCellSchema,
  TestimonialsDisplayModeSchema,
} from "@compoz/validation/pages/blocks/cells/details/testimonials";

export {
  TimelineCellSchema,
  TimelineItemSchema,
  TimelineKeywordSchema,
} from "@compoz/validation/pages/blocks/cells/details/timeline";
