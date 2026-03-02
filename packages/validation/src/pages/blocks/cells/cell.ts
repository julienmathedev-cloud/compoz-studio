/**
 * @file  packages/validation/src/pages/blocks/cells/cell.ts
 * @layer schemas
 * @description
 * Schémas Zod décrivant la forme frontière des cells (API / infra).
 * Validation de structure uniquement ; invariants métier traités dans le domaine.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                                  Atoms                                     */
/* -------------------------------------------------------------------------- */

export const ImageEditorIdSchema = z
  .string()
  .trim()
  .min(1, ERROR_CODES.CELL_IMAGE_ID_REQUIRED);

export const ImageEditorSchema = z
  .object({
    id: ImageEditorIdSchema,
    src: z.string().trim(),
    alt: z.string(),
    caption: z.string().optional(),
    href: z
      .string()
      .trim()
      .min(1, ERROR_CODES.CELL_IMAGE_HREF_INVALID)
      .nullable()
      .optional(),

    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const hasSrc = data.src.trim().length > 0;

    if (hasSrc) {
      if (!data.width) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["width"],
          message: ERROR_CODES.CELL_IMAGE_WIDTH_REQUIRED,
        });
      }
      if (!data.height) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["height"],
          message: ERROR_CODES.CELL_IMAGE_HEIGHT_REQUIRED,
        });
      }
    }
  });

/* -------------------------------------------------------------------------- */
/*                                  Cells                                     */
/* -------------------------------------------------------------------------- */

export const RichTextCellSchema = z
  .object({
    kind: z.literal("richText"),
    content: z.string(),
  })
  .strict();

export const ImageVariantSchema = z.enum(
  ["default", "wide", "square", "portrait"] as const,
  {
    message: ERROR_CODES.IMAGE_VARIANT_INVALID,
  },
);

export const ImageCellSchema = z
  .object({
    kind: z.literal("image"),
    image: ImageEditorSchema,
    variant: ImageVariantSchema.optional(),
  })
  .strict();

export const GalleryMaxColumnsSchema = z.union(
  [
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ] as const,
  { message: ERROR_CODES.GALLERY_MAX_COLUMNS_INVALID },
);

export const GalleryCellSchema = z
  .object({
    kind: z.literal("gallery"),
    linksEnabled: z.boolean(),
    maxColumns: GalleryMaxColumnsSchema, // ✅ NEW
    images: z.array(ImageEditorSchema).min(1, ERROR_CODES.CELL_IMAGES_MIN_1),
  })
  .strict();

export const CarouselCellSchema = z
  .object({
    kind: z.literal("carousel"),
    images: z.array(ImageEditorSchema).min(1, ERROR_CODES.CELL_IMAGES_MIN_1),
  })
  .strict();

export const CellSchema = z.discriminatedUnion("kind", [
  RichTextCellSchema,
  ImageCellSchema,
  GalleryCellSchema,
  CarouselCellSchema,
]);

export type CellShape = z.infer<typeof CellSchema>;
export type RichTextCellShape = z.infer<typeof RichTextCellSchema>;
export type ImageCellShape = z.infer<typeof ImageCellSchema>;
export type GalleryCellShape = z.infer<typeof GalleryCellSchema>;
export type CarouselCellShape = z.infer<typeof CarouselCellSchema>;
export type ImageEditorShape = z.infer<typeof ImageEditorSchema>;
