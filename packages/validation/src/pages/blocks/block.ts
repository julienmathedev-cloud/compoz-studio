/**
 * @file packages/validation/src/pages/blocks/block.ts
 * @layer schemas
 * @description
 * Définit les schémas Zod décrivant la forme frontière des blocks/cells d’une page.
 * Ces schémas valident uniquement la structure (API / infra) ; les invariants métier
 * et règles de cohérence sont traités dans le domaine.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { CellSchema } from "@compoz/validation/pages/blocks/cells/cell";
import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                               Schémas atomiques                            */
/* -------------------------------------------------------------------------- */

export const BlockIdSchema = z
  .string()
  .trim()
  .min(1, ERROR_CODES.BLOCK_ID_REQUIRED);

export const LayoutSectionColumnsSchema = z.union(
  [z.literal(1), z.literal(2), z.literal(3)] as const,
  { message: ERROR_CODES.LAYOUT_SECTION_COLUMNS_INVALID },
);

export const LayoutSectionTitleSchema = z
  .object({
    text: z.string().trim(),
    display: z.enum(["visible", "sr-only"] as const, {
      message: ERROR_CODES.LAYOUT_SECTION_TITLE_DISPLAY_INVALID,
    }),
  })
  .strict();

export const LayoutSectionLayoutSchema = z
  .object({
    columns: LayoutSectionColumnsSchema,
  })
  .strict();

export const LayoutSectionContainerModeSchema = z.enum(
  ["contained", "fullBleed"] as const,
  { message: ERROR_CODES.LAYOUT_SECTION_CONTAINER_MODE_INVALID },
);

/* -------------------------------------------------------------------------- */
/*                                   Blocks                                   */
/* -------------------------------------------------------------------------- */

export const LayoutSectionBlockSchema = z
  .object({
    id: BlockIdSchema,
    type: z.literal("layoutSection"),
    layout: LayoutSectionLayoutSchema,
    containerMode: LayoutSectionContainerModeSchema,
    titleEnabled: z.boolean(),
    title: LayoutSectionTitleSchema,
    lcpPriority: z.boolean(),
    cells: z.array(CellSchema),
  })
  .strict();

// Prépare l’évolution : plusieurs blocks à terme.
export const BlockSchema = z.discriminatedUnion("type", [
  LayoutSectionBlockSchema,
]);

export type BlockShape = z.infer<typeof BlockSchema>;
export type LayoutSectionBlockShape = z.infer<typeof LayoutSectionBlockSchema>;
