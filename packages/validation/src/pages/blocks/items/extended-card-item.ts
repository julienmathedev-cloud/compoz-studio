/**
 * @file packages/validation/src/pages/blocks/items/extended-card-item.ts
 * @layer schemas
 *
 * @description
 * Zod schemas for reusable extended card items.
 *
 * @remarks
 * Extended card items carry content only. Layout concerns such as columns,
 * alignment, or reveal behavior are handled by the parent cell.
 */

import { CONTENT_ICON_KINDS } from "@compoz/core/constants/icons/content-icons";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

import { ButtonItemSchema } from "@compoz/validation/pages/blocks/cells/details/buttons";
import { CellItemIdSchema } from "@compoz/validation/pages/blocks/cells/details/common";

export const ExtendedCardBulletSchema = z
  .string()
  .trim()
  .min(1, ERROR_CODES.CELL_CARDS_EXTENDED_ITEM_BULLET_INVALID);

export const ExtendedCardItemSchema = z
  .object({
    id: CellItemIdSchema,

    eyebrow: z.string().trim().nullable(),

    title: z
      .string()
      .trim()
      .min(1, ERROR_CODES.CELL_CARDS_EXTENDED_ITEM_TITLE_REQUIRED),

    description: z
      .string()
      .trim()
      .min(1, ERROR_CODES.CELL_CARDS_EXTENDED_ITEM_DESCRIPTION_REQUIRED),

    bullets: z.array(ExtendedCardBulletSchema, {
      message: ERROR_CODES.CELL_CARDS_EXTENDED_ITEM_BULLETS_INVALID,
    }),

    footer: z
      .string({
        message: ERROR_CODES.CELL_CARDS_EXTENDED_ITEM_FOOTER_INVALID,
      })
      .trim()
      .nullable(),

    icon: z
      .enum(CONTENT_ICON_KINDS, {
        message: ERROR_CODES.CELL_CARDS_EXTENDED_ITEM_ICON_INVALID,
      })
      .nullable(),

    button: ButtonItemSchema.nullable(),
  })
  .strict();
