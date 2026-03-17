/**
 * @file packages/validation/src/pages/blocks/cells/cell.ts
 * @layer schemas
 * @description
 * Schémas Zod décrivant la forme frontière des cells (API / infra).
 */

import { z } from "zod";

import type { ButtonItemSchema } from "@compoz/validation/pages/blocks/cells/details/buttons";
import { ButtonsCellSchema } from "@compoz/validation/pages/blocks/cells/details/buttons";
import type { CardItemSchema } from "@compoz/validation/pages/blocks/cells/details/cards";
import { CardsCellSchema } from "@compoz/validation/pages/blocks/cells/details/cards";
import type { CardsExtendedItemSchema } from "@compoz/validation/pages/blocks/cells/details/cards-extended";
import { CardsExtendedCellSchema } from "@compoz/validation/pages/blocks/cells/details/cards-extended";
import type {
  CarouselItemKindSchema,
  CarouselItemSchema,
  CarouselVariantSchema,
} from "@compoz/validation/pages/blocks/cells/details/carousel";
import { CarouselCellSchema } from "@compoz/validation/pages/blocks/cells/details/carousel";
import type {
  FormFieldSchema,
  FormFieldTypeSchema,
} from "@compoz/validation/pages/blocks/cells/details/form";
import { FormCellSchema } from "@compoz/validation/pages/blocks/cells/details/form";
import { GalleryCellSchema } from "@compoz/validation/pages/blocks/cells/details/gallery";
import { HeadingCellSchema } from "@compoz/validation/pages/blocks/cells/details/heading";
import type { ImageEditorSchema } from "@compoz/validation/pages/blocks/cells/details/image";
import { ImageCellSchema } from "@compoz/validation/pages/blocks/cells/details/image";
import { RichTextCellSchema } from "@compoz/validation/pages/blocks/cells/details/rich-text";
import { SeparatorCellSchema } from "@compoz/validation/pages/blocks/cells/details/separator";
import { SpacerCellSchema } from "@compoz/validation/pages/blocks/cells/details/spacer";
import type { StepItemSchema } from "@compoz/validation/pages/blocks/cells/details/steps";
import { StepsCellSchema } from "@compoz/validation/pages/blocks/cells/details/steps";
import type {
  StructuredCardColumnsSchema,
  StructuredCardItemSchema,
  StructuredCardSectionSchema,
} from "@compoz/validation/pages/blocks/cells/details/structured-card";
import { StructuredCardCellSchema } from "@compoz/validation/pages/blocks/cells/details/structured-card";
import type {
  TimelineItemSchema,
  TimelineKeywordSchema,
} from "@compoz/validation/pages/blocks/cells/details/timeline";
import { TimelineCellSchema } from "@compoz/validation/pages/blocks/cells/details/timeline";

export const CellSchema = z.discriminatedUnion("kind", [
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
  StructuredCardCellSchema,
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
export type CardsCellInput = z.input<typeof CardsCellSchema>;
export type CardsCellOutput = z.output<typeof CardsCellSchema>;
export type CardsExtendedCellInput = z.input<typeof CardsExtendedCellSchema>;
export type CardsExtendedCellOutput = z.output<typeof CardsExtendedCellSchema>;
export type CarouselCellInput = z.input<typeof CarouselCellSchema>;
export type CarouselCellOutput = z.output<typeof CarouselCellSchema>;
export type StepsCellInput = z.input<typeof StepsCellSchema>;
export type StepsCellOutput = z.output<typeof StepsCellSchema>;
export type StructuredCardCellInput = z.input<typeof StructuredCardCellSchema>;
export type StructuredCardCellOutput = z.output<
  typeof StructuredCardCellSchema
>;
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
export type ButtonsCellShape = z.infer<typeof ButtonsCellSchema>;
export type CardItemShape = z.infer<typeof CardItemSchema>;
export type CardsCellShape = z.infer<typeof CardsCellSchema>;
export type CardsExtendedItemShape = z.infer<typeof CardsExtendedItemSchema>;
export type CardsExtendedCellShape = z.infer<typeof CardsExtendedCellSchema>;
export type CarouselVariantShape = z.infer<typeof CarouselVariantSchema>;
export type CarouselItemKindShape = z.infer<typeof CarouselItemKindSchema>;
export type CarouselItemShape = z.infer<typeof CarouselItemSchema>;
export type CarouselCellShape = z.infer<typeof CarouselCellSchema>;
export type StepItemShape = z.infer<typeof StepItemSchema>;
export type StepsCellShape = z.infer<typeof StepsCellSchema>;
export type StructuredCardSectionShape = z.infer<
  typeof StructuredCardSectionSchema
>;
export type StructuredCardItemShape = z.infer<typeof StructuredCardItemSchema>;
export type StructuredCardColumnsShape = z.infer<
  typeof StructuredCardColumnsSchema
>;
export type StructuredCardCellShape = z.infer<typeof StructuredCardCellSchema>;
export type FormFieldTypeShape = z.infer<typeof FormFieldTypeSchema>;
export type FormFieldShape = z.infer<typeof FormFieldSchema>;
export type FormCellShape = z.infer<typeof FormCellSchema>;
export type TimelineKeywordShape = z.infer<typeof TimelineKeywordSchema>;
export type TimelineItemShape = z.infer<typeof TimelineItemSchema>;
export type TimelineCellShape = z.infer<typeof TimelineCellSchema>;
export type ImageCellShape = z.infer<typeof ImageCellSchema>;
export type GalleryCellShape = z.infer<typeof GalleryCellSchema>;
export type ImageEditorShape = z.infer<typeof ImageEditorSchema>;

export {
  ButtonItemSchema,
  ButtonsCellSchema,
} from "@compoz/validation/pages/blocks/cells/details/buttons";
export {
  CardItemSchema,
  CardsCellSchema,
} from "@compoz/validation/pages/blocks/cells/details/cards";
export {
  CardsExtendedAlignSchema,
  CardsExtendedBulletSchema,
  CardsExtendedCellSchema,
  CardsExtendedColumnsSchema,
  CardsExtendedItemSchema,
} from "@compoz/validation/pages/blocks/cells/details/cards-extended";
export {
  CarouselCellSchema,
  CarouselItemKindSchema,
  CarouselItemSchema,
  CarouselVariantSchema,
} from "@compoz/validation/pages/blocks/cells/details/carousel";
export {
  FormCellSchema,
  FormFieldSchema,
  FormFieldTypeSchema,
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
} from "@compoz/validation/pages/blocks/cells/details/image";
export { RichTextCellSchema } from "@compoz/validation/pages/blocks/cells/details/rich-text";
export { SeparatorCellSchema } from "@compoz/validation/pages/blocks/cells/details/separator";
export { SpacerCellSchema } from "@compoz/validation/pages/blocks/cells/details/spacer";
export {
  StepItemSchema,
  StepsCellSchema,
  StepsVariantSchema,
} from "@compoz/validation/pages/blocks/cells/details/steps";
export {
  StructuredCardCellSchema,
  StructuredCardColumnsSchema,
  StructuredCardItemSchema,
  StructuredCardSectionSchema,
} from "@compoz/validation/pages/blocks/cells/details/structured-card";
export {
  TimelineCellSchema,
  TimelineItemSchema,
  TimelineKeywordSchema,
} from "@compoz/validation/pages/blocks/cells/details/timeline";
