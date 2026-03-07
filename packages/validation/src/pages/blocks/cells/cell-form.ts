/**
 * @file packages/validation/src/pages/blocks/cells/cell-form.ts
 * @layer schemas
 * @description
 * Schémas Zod décrivant la forme des formulaires UI (RHF) pour l’édition des cells.
 */

import { z } from "zod";

import {
  CarouselCellSchema,
  GalleryCellSchema,
  ImageCellSchema,
  ImageEditorSchema,
  RichTextCellSchema,
} from "@compoz/validation/pages/blocks/cells/cell";

/* -------------------------------------------------------------------------- */
/*                                   Forms                                    */
/* -------------------------------------------------------------------------- */

export const CellFormSchema = z.discriminatedUnion("kind", [
  RichTextCellSchema,
  ImageCellSchema,
  GalleryCellSchema,
  CarouselCellSchema,
]);

export type CellFormValues = z.infer<typeof CellFormSchema>;

export const RichTextCellFormValuesSchema = RichTextCellSchema;
export type RichTextCellFormValues = z.infer<
  typeof RichTextCellFormValuesSchema
>;

export const ImageCellFormValuesSchema = ImageCellSchema;
export type ImageCellFormValues = z.infer<typeof ImageCellFormValuesSchema>;

export const GalleryCellFormValuesSchema = GalleryCellSchema;
export type GalleryCellFormValues = z.infer<typeof GalleryCellFormValuesSchema>;

export const CarouselCellFormValuesSchema = CarouselCellSchema;
export type CarouselCellFormValues = z.infer<
  typeof CarouselCellFormValuesSchema
>;

export const ImageEditorFormValuesSchema = ImageEditorSchema;
export type ImageEditorFormValues = z.infer<typeof ImageEditorFormValuesSchema>;
