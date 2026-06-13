/**
 * @file packages/validation/src/pages/blocks/cells/cell-intents.ts
 * @layer schemas
 * @description
 * Définit les schémas Zod décrivant la forme frontière des intentions liées aux cells.
 */

import type { z } from "zod";

import {
  ButtonItemSchema,
  ButtonsCellSchema,
  CardCollectionCellSchema,
  CardCollectionItemSchema,
  CardCollectionCardKindSchema,
  CardItemSchema,
  CardsCellSchema,
  CardsExtendedCellSchema,
  CardsExtendedItemSchema,
  CarouselCellSchema,
  CarouselItemKindSchema,
  CarouselItemSchema,
  CarouselVariantSchema,
  CellSchema,
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
  StructuredCardCellSchema,
  StructuredCardItemSchema,
  StructuredCardSectionSchema,
  TimelineCellSchema,
  TimelineItemSchema,
} from "@compoz/validation/pages/blocks/cells/cell";

export const CellIntentSchema = CellSchema;
export type CellIntentDTO = z.infer<typeof CellIntentSchema>;

export const RichTextCellIntentSchema = RichTextCellSchema;
export type RichTextCellIntentDTO = z.infer<typeof RichTextCellIntentSchema>;

export const HeadingCellIntentSchema = HeadingCellSchema;
export type HeadingCellIntentDTO = z.infer<typeof HeadingCellIntentSchema>;

export const SpacerCellIntentSchema = SpacerCellSchema;
export type SpacerCellIntentDTO = z.infer<typeof SpacerCellIntentSchema>;

export const SeparatorCellIntentSchema = SeparatorCellSchema;
export type SeparatorCellIntentDTO = z.infer<typeof SeparatorCellIntentSchema>;

export const ButtonItemIntentSchema = ButtonItemSchema;
export type ButtonItemIntentDTO = z.infer<typeof ButtonItemIntentSchema>;

export const ButtonsCellIntentSchema = ButtonsCellSchema;
export type ButtonsCellIntentDTO = z.infer<typeof ButtonsCellIntentSchema>;

export const CardItemIntentSchema = CardItemSchema;
export type CardItemIntentDTO = z.infer<typeof CardItemIntentSchema>;

export const CardsCellIntentSchema = CardsCellSchema;
export type CardsCellIntentDTO = z.infer<typeof CardsCellIntentSchema>;

export const CardsExtendedItemIntentSchema = CardsExtendedItemSchema;
export type CardsExtendedItemIntentDTO = z.infer<
  typeof CardsExtendedItemIntentSchema
>;

export const CardsExtendedCellIntentSchema = CardsExtendedCellSchema;
export type CardsExtendedCellIntentDTO = z.infer<
  typeof CardsExtendedCellIntentSchema
>;

export const CarouselVariantIntentSchema = CarouselVariantSchema;
export type CarouselVariantIntentDTO = z.infer<
  typeof CarouselVariantIntentSchema
>;

export const CarouselItemKindIntentSchema = CarouselItemKindSchema;
export type CarouselItemKindIntentDTO = z.infer<
  typeof CarouselItemKindIntentSchema
>;

export const CarouselItemIntentSchema = CarouselItemSchema;
export type CarouselItemIntentDTO = z.infer<typeof CarouselItemIntentSchema>;

export const CarouselCellIntentSchema = CarouselCellSchema;
export type CarouselCellIntentDTO = z.infer<typeof CarouselCellIntentSchema>;

export const CardCollectionCardKindIntentSchema = CardCollectionCardKindSchema;
export type CardCollectionCardKindIntentDTO = z.infer<
  typeof CardCollectionCardKindIntentSchema
>;

export const CardCollectionItemIntentSchema = CardCollectionItemSchema;
export type CardCollectionItemIntentDTO = z.infer<
  typeof CardCollectionItemIntentSchema
>;

export const CardCollectionCellIntentSchema = CardCollectionCellSchema;
export type CardCollectionCellIntentDTO = z.infer<
  typeof CardCollectionCellIntentSchema
>;

export const StepItemIntentSchema = StepItemSchema;
export type StepItemIntentDTO = z.infer<typeof StepItemIntentSchema>;

export const StepsCellIntentSchema = StepsCellSchema;
export type StepsCellIntentDTO = z.infer<typeof StepsCellIntentSchema>;

export const StructuredCardSectionIntentSchema = StructuredCardSectionSchema;
export type StructuredCardSectionIntentDTO = z.infer<
  typeof StructuredCardSectionIntentSchema
>;

export const StructuredCardItemIntentSchema = StructuredCardItemSchema;
export type StructuredCardItemIntentDTO = z.infer<
  typeof StructuredCardItemIntentSchema
>;

export const StructuredCardCellIntentSchema = StructuredCardCellSchema;
export type StructuredCardCellIntentDTO = z.infer<
  typeof StructuredCardCellIntentSchema
>;

export const FormFieldIntentSchema = FormFieldSchema;
export type FormFieldIntentDTO = z.infer<typeof FormFieldIntentSchema>;

export const FormCellIntentSchema = FormCellSchema;
export type FormCellIntentDTO = z.infer<typeof FormCellIntentSchema>;

export const TimelineItemIntentSchema = TimelineItemSchema;
export type TimelineItemIntentDTO = z.infer<typeof TimelineItemIntentSchema>;

export const TimelineCellIntentSchema = TimelineCellSchema;
export type TimelineCellIntentDTO = z.infer<typeof TimelineCellIntentSchema>;

export const ImageCellIntentSchema = ImageCellSchema;
export type ImageCellIntentDTO = z.infer<typeof ImageCellIntentSchema>;

export const GalleryCellIntentSchema = GalleryCellSchema;
export type GalleryCellIntentDTO = z.infer<typeof GalleryCellIntentSchema>;

export const ImageEditorIntentSchema = ImageEditorSchema;
export type ImageEditorIntentDTO = z.infer<typeof ImageEditorIntentSchema>;
