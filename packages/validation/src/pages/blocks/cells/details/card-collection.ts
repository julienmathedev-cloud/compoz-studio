/**
 * @file packages/validation/src/pages/blocks/cells/details/card-collection.ts
 * @layer validation/pages/blocks/cells/details
 *
 * @description
 * Defines Zod schemas for card collection cell data.
 *
 * @remarks
 * Item and column validation depends on `cardKind`, so consistency is enforced in `superRefine`.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

import {
  CellCssClassNameSchema,
  CellIdSchema,
} from "@compoz/validation/pages/blocks/cells/details/common";
import { CardItemSchema } from "@compoz/validation/pages/blocks/items/card-item";
import { ExtendedCardItemSchema } from "@compoz/validation/pages/blocks/items/extended-card-item";
import { StructuredCardItemSchema } from "@compoz/validation/pages/blocks/items/structured-card-item";

export const CardCollectionCardKindSchema = z.enum(
  ["card", "extendedCard", "structuredCard"],
  {
    message: ERROR_CODES.CELL_CARD_COLLECTION_KIND_INVALID,
  },
);

export const CardCollectionCardColumnsSchema = z.union(
  [z.literal(2), z.literal(3), z.literal(4)],
  {
    message: ERROR_CODES.CELL_CARD_COLLECTION_COLUMNS_INVALID,
  },
);

export const CardCollectionStackedColumnsSchema = z.union(
  [z.literal(1), z.literal(2), z.literal(3)],
  {
    message: ERROR_CODES.CELL_CARD_COLLECTION_COLUMNS_INVALID,
  },
);

export const CardCollectionColumnsSchema = z.union(
  [z.literal(1), z.literal(2), z.literal(3), z.literal(4)],
  {
    message: ERROR_CODES.CELL_CARD_COLLECTION_COLUMNS_INVALID,
  },
);

export const CardCollectionAlignSchema = z.enum(["left", "center"], {
  message: ERROR_CODES.CELL_CARD_COLLECTION_ALIGN_INVALID,
});

/**
 * Generic schema for a card collection item.
 *
 * @remarks
 * - Represents the union of all items allowed in a card collection.
 * - Does not guarantee consistency with `cardKind` by itself.
 * - This consistency is validated in `CardCollectionCellSchema.superRefine`.
 */
export const CardCollectionItemSchema = z.union([
  CardItemSchema,
  ExtendedCardItemSchema,
  StructuredCardItemSchema,
]);

export const CardCollectionCellSchema = z
  .object({
    id: CellIdSchema,
    kind: z.literal("cardCollection"),
    cssClassName: CellCssClassNameSchema,
    cardKind: CardCollectionCardKindSchema,
    columns: CardCollectionColumnsSchema,
    align: CardCollectionAlignSchema,
    reveal: z.boolean({
      message: ERROR_CODES.CELL_CARD_COLLECTION_REVEAL_INVALID,
    }),
    items: z
      .array(z.unknown(), {
        message: ERROR_CODES.CELL_CARD_COLLECTION_ITEMS_INVALID,
      })
      .min(1, ERROR_CODES.CELL_CARD_COLLECTION_ITEMS_MIN_1),
  })
  .strict()
  .superRefine((cell, ctx) => {
    const cardKind = cell.cardKind;

    const columnsSchema =
      cardKind === "card"
        ? CardCollectionCardColumnsSchema
        : CardCollectionStackedColumnsSchema;

    const columnsResult = columnsSchema.safeParse(cell.columns);

    if (!columnsResult.success) {
      ctx.addIssue({
        code: "custom",
        message: ERROR_CODES.CELL_CARD_COLLECTION_COLUMNS_INVALID,
        path: ["columns"],
      });
    }

    const schemaMap = {
      card: CardItemSchema,
      extendedCard: ExtendedCardItemSchema,
      structuredCard: StructuredCardItemSchema,
    } as const;

    const schema = schemaMap[cardKind];

    for (let i = 0; i < cell.items.length; i++) {
      const result = schema.safeParse(cell.items[i]);

      if (result.success) continue;

      for (const issue of result.error.issues) {
        ctx.addIssue({
          ...issue,
          path: ["items", i, ...issue.path],
        });
      }
    }
  });
