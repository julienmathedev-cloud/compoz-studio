/**
 * @file packages/validation/src/pages/blocks/cells/cell-form.ts
 * @layer schemas
 * @description
 * Schémas Zod décrivant la forme des formulaires UI (RHF) pour l’édition des cells.
 */

import { z } from "zod";

import {
  ButtonItemSchema,
  ButtonsCellSchema,
  CardItemSchema,
  CardsCellSchema,
  CardsExtendedCellSchema,
  CardsExtendedItemSchema,
  CarouselCellSchema,
  CarouselItemKindSchema,
  CarouselItemSchema,
  CarouselVariantSchema,
  CaseStudyCardCellSchema,
  CaseStudyCardItemSchema,
  FormCellSchema,
  FormFieldSchema,
  GalleryCellSchema,
  HeadingCellSchema,
  ImageCellSchema,
  ImageEditorSchema,
  RichTextCellSchema,
  SeparatorCellSchema,
  SpacerCellSchema,
  StepItemSchema,
  StepsCellSchema,
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
  CardsCellSchema,
  CardsExtendedCellSchema,
  StepsCellSchema,
  CaseStudyCardCellSchema,
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

export const ButtonsCellFormValuesSchema = ButtonsCellSchema;
export type ButtonsCellFormValues = z.infer<typeof ButtonsCellFormValuesSchema>;

export const CardItemFormValuesSchema = CardItemSchema;
export type CardItemFormValues = z.infer<typeof CardItemFormValuesSchema>;

export const CardsCellFormValuesSchema = CardsCellSchema;
export type CardsCellFormValues = z.infer<typeof CardsCellFormValuesSchema>;

export const CardsExtendedItemFormValuesSchema = CardsExtendedItemSchema;
export type CardsExtendedItemFormValues = z.infer<
  typeof CardsExtendedItemFormValuesSchema
>;

export const CardsExtendedCellFormValuesSchema = CardsExtendedCellSchema;
export type CardsExtendedCellFormValues = z.infer<
  typeof CardsExtendedCellFormValuesSchema
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

export const StepItemFormValuesSchema = StepItemSchema;
export type StepItemFormValues = z.infer<typeof StepItemFormValuesSchema>;

export const StepsCellFormValuesSchema = StepsCellSchema;
export type StepsCellFormValues = z.infer<typeof StepsCellFormValuesSchema>;

export const CaseStudyCardItemFormValuesSchema = CaseStudyCardItemSchema;
export type CaseStudyCardItemFormValues = z.infer<
  typeof CaseStudyCardItemFormValuesSchema
>;

export const CaseStudyCardCellFormValuesSchema = CaseStudyCardCellSchema;
export type CaseStudyCardCellFormValues = z.infer<
  typeof CaseStudyCardCellFormValuesSchema
>;

export const FormFieldFormValuesSchema = FormFieldSchema;
export type FormFieldFormValues = z.infer<typeof FormFieldFormValuesSchema>;

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
