/**
 * @file packages/validation/src/pages/blocks/cells/cell-form.ts
 * @layer schemas
 * @description
 * Schémas Zod décrivant la forme des formulaires UI (RHF) pour l’édition des cells.
 */

import { z } from "zod";

import {
  CarouselCellSchema,
  ImageEditorSchema,
  GalleryCellSchema,
  ImageCellSchema,
  RichTextCellSchema,
} from "@compoz/validation/pages/blocks/cells/cell";

/* -------------------------------------------------------------------------- */
/*                                   helpers                                  */
/* -------------------------------------------------------------------------- */

const RichTextCellFormSchema = RichTextCellSchema;
const ImageCellFormSchema = ImageCellSchema;
const GalleryCellFormSchema = GalleryCellSchema;
const CarouselCellFormSchema = CarouselCellSchema;

const ImageEditorFormSchema = ImageEditorSchema;

/* -------------------------------------------------------------------------- */
/*                                   Forms                                    */
/* -------------------------------------------------------------------------- */

export const CellFormSchema = z.discriminatedUnion("kind", [
  RichTextCellFormSchema,
  ImageCellFormSchema,
  GalleryCellFormSchema,
  CarouselCellFormSchema,
]);

export type CellFormValues = z.infer<typeof CellFormSchema>;

export const RichTextCellFormValuesSchema = RichTextCellFormSchema;
export type RichTextCellFormValues = z.infer<
  typeof RichTextCellFormValuesSchema
>;

export const ImageCellFormValuesSchema = ImageCellFormSchema;
export type ImageCellFormValues = z.infer<typeof ImageCellFormValuesSchema>;

export const GalleryCellFormValuesSchema = GalleryCellFormSchema;
export type GalleryCellFormValues = z.infer<typeof GalleryCellFormValuesSchema>;

export const CarouselCellFormValuesSchema = CarouselCellFormSchema;
export type CarouselCellFormValues = z.infer<
  typeof CarouselCellFormValuesSchema
>;

export const ImageEditorFormValuesSchema = ImageEditorFormSchema;
export type ImageEditorFormValues = z.infer<typeof ImageEditorFormValuesSchema>;
