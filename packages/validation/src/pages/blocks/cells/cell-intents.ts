/**
 * @file packages/validation/src/pages/blocks/cells/cell-intents.ts
 * @layer schemas
 * @description
 * Définit les schémas Zod décrivant la forme frontière des intentions liées aux cells.
 */

import type { z } from "zod";

import {
  CarouselCellSchema,
  ImageEditorSchema,
  CellSchema,
  GalleryCellSchema,
  ImageCellSchema,
  RichTextCellSchema,
} from "@compoz/validation/pages/blocks/cells/cell";

/* -------------------------------------------------------------------------- */
/*                            Intentions (payloads)                           */
/* -------------------------------------------------------------------------- */

export const CellIntentSchema = CellSchema;
export type CellIntentDTO = z.infer<typeof CellIntentSchema>;

export const RichTextCellIntentSchema = RichTextCellSchema;
export type RichTextCellIntentDTO = z.infer<typeof RichTextCellIntentSchema>;

export const ImageCellIntentSchema = ImageCellSchema;
export type ImageCellIntentDTO = z.infer<typeof ImageCellIntentSchema>;

export const GalleryCellIntentSchema = GalleryCellSchema;
export type GalleryCellIntentDTO = z.infer<typeof GalleryCellIntentSchema>;

export const CarouselCellIntentSchema = CarouselCellSchema;
export type CarouselCellIntentDTO = z.infer<typeof CarouselCellIntentSchema>;

export const ImageEditorIntentSchema = ImageEditorSchema;
export type ImageEditorIntentDTO = z.infer<typeof ImageEditorIntentSchema>;
