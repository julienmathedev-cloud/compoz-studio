/**
 * @file packages/validation/src/pages/blocks/cells/details/card-collection.ts
 * @layer schemas
 * @description Schéma Zod de CardCollectionCell.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

import {
  CardItemSchema,
  CardsAlignSchema,
  CardsColumnsSchema,
} from "@compoz/validation/pages/blocks/cells/details/cards";
import {
  CardsExtendedColumnsSchema,
  CardsExtendedItemSchema,
} from "@compoz/validation/pages/blocks/cells/details/cards-extended";
import {
  CellCssClassNameSchema,
  CellIdSchema,
} from "@compoz/validation/pages/blocks/cells/details/common";
import { StructuredCardItemSchema } from "@compoz/validation/pages/blocks/cells/details/structured-card";

export const CardCollectionCardKindSchema = z.enum(
  ["card", "cardsExtended", "structuredCard"],
  {
    message: ERROR_CODES.CELL_CARD_COLLECTION_KIND_INVALID,
  },
);

/**
 * Schéma générique d’un item de collection de cartes.
 *
 * @remarks
 * - Représente l’union de tous les items autorisés dans une card collection.
 * - Ne suffit pas à lui seul à valider la cohérence avec `cardKind`.
 * - Cette cohérence reste validée dans `CardCollectionCellSchema.superRefine`.
 */
export const CardCollectionItemSchema = z.union([
  CardItemSchema,
  CardsExtendedItemSchema,
  StructuredCardItemSchema,
]);

export const CardCollectionCellSchema = z
  .object({
    id: CellIdSchema,
    kind: z.literal("cardCollection"),
    cssClassName: CellCssClassNameSchema,
    cardKind: CardCollectionCardKindSchema,
    columns: z.union(
      [z.literal(1), z.literal(2), z.literal(3), z.literal(4)],
      {
        message: ERROR_CODES.CELL_CARD_COLLECTION_COLUMNS_INVALID,
      },
    ),
    align: CardsAlignSchema,
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
    const columnsSchema =
      cell.cardKind === "card"
        ? CardsColumnsSchema
        : CardsExtendedColumnsSchema;

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
      cardsExtended: CardsExtendedItemSchema,
      structuredCard: StructuredCardItemSchema,
    } as const;

    const schema = schemaMap[cell.cardKind];

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
