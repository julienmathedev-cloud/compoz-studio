/**
 * @file packages/validation/src/pages/blocks/cells/details/carousel.ts
 * @layer schemas
 * @description
 * Schéma Zod de CarouselCell.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

import { CellIdSchema } from "@compoz/validation/pages/blocks/cells/details/common";

import { CardItemSchema } from "@compoz/validation/pages/blocks/cells/details/cards";
import { CardsExtendedItemSchema } from "@compoz/validation/pages/blocks/cells/details/cards-extended";
import { CaseStudyCardItemSchema } from "@compoz/validation/pages/blocks/cells/details/case-study-card";
import { ImageEditorSchema } from "@compoz/validation/pages/blocks/cells/details/image";

/* ------------------------------------------------------------------ */
/* Variant                                                            */
/* ------------------------------------------------------------------ */

export const CarouselVariantSchema = z.enum(["carousel", "slider"], {
  message: ERROR_CODES.CELL_INVALID,
});

/* ------------------------------------------------------------------ */
/* Item kind                                                          */
/* ------------------------------------------------------------------ */

export const CarouselItemKindSchema = z.enum(
  ["image", "card", "cardsExtended", "caseStudyCard"],
  {
    message: ERROR_CODES.CELL_INVALID,
  },
);

/* ------------------------------------------------------------------ */
/* Items                                                              */
/* ------------------------------------------------------------------ */

export const CarouselItemSchema = z.union([
  ImageEditorSchema,
  CardItemSchema,
  CardsExtendedItemSchema,
  CaseStudyCardItemSchema,
]);

/* ------------------------------------------------------------------ */
/* Cell                                                               */
/* ------------------------------------------------------------------ */

export const CarouselCellSchema = z
  .object({
    id: CellIdSchema,

    kind: z.literal("carousel"),

    variant: CarouselVariantSchema,

    showDots: z.boolean(),

    showArrows: z.boolean(),

    itemKind: CarouselItemKindSchema,

    items: z.array(CarouselItemSchema).min(1, ERROR_CODES.CELL_INVALID),
  })
  .strict();
