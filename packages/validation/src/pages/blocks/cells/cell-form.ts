/**
 * @file packages/validation/src/pages/blocks/cells/cell-form.ts
 * @layer schemas
 *
 * @description
 * Zod schemas describing the UI form shape used to edit cells with RHF.
 */

import { z } from "zod";

import {
  ButtonIconPositionSchema,
  ButtonItemSchema,
  ButtonPresentationSchema,
  ButtonsCellSchema,
  CardCollectionCardKindSchema,
  CardCollectionCellSchema,
  CardCollectionItemSchema,
  CardItemSchema,
  CarouselCellSchema,
  CarouselItemKindSchema,
  CarouselItemSchema,
  CarouselVariantSchema,
  ExtendedCardItemSchema,
  FormCellSchema,
  FormFieldSchema,
  FormSubmitButtonSchema,
  GalleryCellSchema,
  HeadingCellSchema,
  ImageCellSchema,
  ImageEditorSchema,
  RichTextCellSchema,
  SeparatorCellSchema,
  SpacerCellSchema,
  StepItemSchema,
  StepsCellSchema,
  StructuredCardItemSchema,
  StructuredCardSectionSchema,
  TestimonialItemSchema,
  TestimonialRatingSchema,
  TestimonialsCellSchema,
  TestimonialsDisplayModeSchema,
  TimelineCellSchema,
  TimelineItemSchema,
} from "@compoz/validation/pages/blocks/cells/cell";

export const CellFormSchema = z.discriminatedUnion("kind", [
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

export type CellFormValues = z.infer<typeof CellFormSchema>;

export const HeadingCellFormValuesSchema = HeadingCellSchema;
export type HeadingCellFormValues = z.infer<typeof HeadingCellFormValuesSchema>;

export const RichTextCellFormValuesSchema = RichTextCellSchema;
export type RichTextCellFormValues = z.infer<
  typeof RichTextCellFormValuesSchema
>;

export const SpacerCellFormValuesSchema = SpacerCellSchema;
export type SpacerCellFormValues = z.infer<typeof SpacerCellFormValuesSchema>;

export const SeparatorCellFormValuesSchema = SeparatorCellSchema;
export type SeparatorCellFormValues = z.infer<
  typeof SeparatorCellFormValuesSchema
>;

export const ButtonItemFormValuesSchema = ButtonItemSchema;
export type ButtonItemFormValues = z.infer<typeof ButtonItemFormValuesSchema>;

export const ButtonPresentationFormValuesSchema = ButtonPresentationSchema;
export type ButtonPresentationFormValues = z.infer<
  typeof ButtonPresentationFormValuesSchema
>;

export const ButtonIconPositionFormValuesSchema = ButtonIconPositionSchema;
export type ButtonIconPositionFormValues = z.infer<
  typeof ButtonIconPositionFormValuesSchema
>;

export const ButtonsCellFormValuesSchema = ButtonsCellSchema;
export type ButtonsCellFormValues = z.infer<typeof ButtonsCellFormValuesSchema>;

export const CardItemFormValuesSchema = CardItemSchema;
export type CardItemFormValues = z.infer<typeof CardItemFormValuesSchema>;

export const ExtendedCardItemFormValuesSchema = ExtendedCardItemSchema;
export type ExtendedCardItemFormValues = z.infer<
  typeof ExtendedCardItemFormValuesSchema
>;

export const StructuredCardSectionFormValuesSchema =
  StructuredCardSectionSchema;
export type StructuredCardSectionFormValues = z.infer<
  typeof StructuredCardSectionFormValuesSchema
>;

export const StructuredCardItemFormValuesSchema = StructuredCardItemSchema;
export type StructuredCardItemFormValues = z.infer<
  typeof StructuredCardItemFormValuesSchema
>;

export const CarouselVariantFormValuesSchema = CarouselVariantSchema;
export type CarouselVariantFormValues = z.infer<
  typeof CarouselVariantFormValuesSchema
>;

export const CarouselItemKindFormValuesSchema = CarouselItemKindSchema;
export type CarouselItemKindFormValues = z.infer<
  typeof CarouselItemKindFormValuesSchema
>;

export const CarouselItemFormValuesSchema = CarouselItemSchema;
export type CarouselItemFormValues = z.infer<
  typeof CarouselItemFormValuesSchema
>;

export const CarouselCellFormValuesSchema = CarouselCellSchema;
export type CarouselCellFormValues = z.infer<
  typeof CarouselCellFormValuesSchema
>;

export const CardCollectionCardKindFormValuesSchema =
  CardCollectionCardKindSchema;
export type CardCollectionCardKindFormValues = z.infer<
  typeof CardCollectionCardKindFormValuesSchema
>;

export const CardCollectionItemFormValuesSchema = CardCollectionItemSchema;
export type CardCollectionItemFormValues = z.infer<
  typeof CardCollectionItemFormValuesSchema
>;

export const CardCollectionCellFormValuesSchema = CardCollectionCellSchema;
export type CardCollectionCellFormValues = z.infer<
  typeof CardCollectionCellFormValuesSchema
>;

export const StepItemFormValuesSchema = StepItemSchema;
export type StepItemFormValues = z.infer<typeof StepItemFormValuesSchema>;

export const StepsCellFormValuesSchema = StepsCellSchema;
export type StepsCellFormValues = z.infer<typeof StepsCellFormValuesSchema>;

export const TestimonialsDisplayModeFormValuesSchema =
  TestimonialsDisplayModeSchema;
export type TestimonialsDisplayModeFormValues = z.infer<
  typeof TestimonialsDisplayModeFormValuesSchema
>;

export const TestimonialRatingFormValuesSchema = TestimonialRatingSchema;
export type TestimonialRatingFormValues = z.infer<
  typeof TestimonialRatingFormValuesSchema
>;

export const TestimonialItemFormValuesSchema = TestimonialItemSchema;
export type TestimonialItemFormValues = z.infer<
  typeof TestimonialItemFormValuesSchema
>;

export const TestimonialsCellFormValuesSchema = TestimonialsCellSchema;
export type TestimonialsCellFormValues = z.infer<
  typeof TestimonialsCellFormValuesSchema
>;

export const FormFieldFormValuesSchema = FormFieldSchema;
export type FormFieldFormValues = z.infer<typeof FormFieldFormValuesSchema>;

export const FormSubmitButtonFormValuesSchema = FormSubmitButtonSchema;
export type FormSubmitButtonFormValues = z.infer<
  typeof FormSubmitButtonFormValuesSchema
>;

export const FormCellFormValuesSchema = FormCellSchema;
export type FormCellFormValues = z.infer<typeof FormCellFormValuesSchema>;

export const TimelineItemFormValuesSchema = TimelineItemSchema;
export type TimelineItemFormValues = z.infer<
  typeof TimelineItemFormValuesSchema
>;

export const TimelineCellFormValuesSchema = TimelineCellSchema;
export type TimelineCellFormValues = z.infer<
  typeof TimelineCellFormValuesSchema
>;

export const ImageCellFormValuesSchema = ImageCellSchema;
export type ImageCellFormValues = z.infer<typeof ImageCellFormValuesSchema>;

export const GalleryCellFormValuesSchema = GalleryCellSchema;
export type GalleryCellFormValues = z.infer<typeof GalleryCellFormValuesSchema>;

export const ImageEditorFormValuesSchema = ImageEditorSchema;
export type ImageEditorFormValues = z.infer<typeof ImageEditorFormValuesSchema>;
