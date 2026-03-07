/**
 * @file packages/validation/src/pages/blocks/block-intents.ts
 * @layer schemas
 * @description
 * Définit les schémas Zod décrivant la forme frontière des intentions liées aux blocks.
 * Ces schémas valident uniquement la structure des payloads (API) ; les invariants métier
 * et règles de cohérence sont traités dans le domaine.
 */

import { z } from "zod";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import {
  BlockIdSchema,
  LayoutSectionColumnsSchema,
  LayoutSectionContainerModeSchema,
  LayoutSectionTitleSchema,
} from "@compoz/validation/pages/blocks/block";
import { CellSchema } from "@compoz/validation/pages/blocks/cells/cell";

/* -------------------------------------------------------------------------- */
/*                                   helpers                                  */
/* -------------------------------------------------------------------------- */

// ordered ids (reorder) : non vides ; unicité/permutation vérifiées côté domaine.
const OrderedBlockIdsIntentSchema = z
  .array(BlockIdSchema)
  .min(1, ERROR_CODES.BLOCKS_INVALID);

// Patch contrôlé V0.5 pour un LayoutSectionBlock.
const LayoutSectionBlockPatchSchema = z
  .object({
    columns: LayoutSectionColumnsSchema.optional(),
    containerMode: LayoutSectionContainerModeSchema.optional(),

    // toggle title (présence de clé = patch)
    titleEnabled: z.boolean().optional(),

    // contrat : title toujours un objet (plus de null)
    // undefined: inchangé | objet: remplacé
    title: LayoutSectionTitleSchema.optional(),
    lcpPriority: z.boolean().optional(),
    cells: z.array(CellSchema).optional(),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                            Intentions HTTP API                             */
/* -------------------------------------------------------------------------- */

/** Intention d’ajout d’un block LayoutSection sur une page (draft). */
export const CreateLayoutSectionBlockIntentSchema = z
  .object({
    columns: LayoutSectionColumnsSchema,
    containerMode: LayoutSectionContainerModeSchema,
    insertAt: z.number().int().min(0).optional(),

    // le toggle est explicite
    titleEnabled: z.boolean(),

    // contrat : title toujours présent
    title: LayoutSectionTitleSchema,
    lcpPriority: z.boolean(),
    cells: z.array(CellSchema),
  })
  .strict();

export type CreateLayoutSectionBlockIntentDTO = z.infer<
  typeof CreateLayoutSectionBlockIntentSchema
>;

/** Intention de mise à jour d’un block LayoutSection (draft). */
export const UpdateLayoutSectionBlockIntentSchema = z
  .object({
    blockId: BlockIdSchema,
    patch: LayoutSectionBlockPatchSchema,
  })
  .strict();

export type UpdateLayoutSectionBlockIntentDTO = z.infer<
  typeof UpdateLayoutSectionBlockIntentSchema
>;

/** Intention de suppression d’un block d’une page (draft). */
export const DeleteBlockIntentSchema = z
  .object({
    blockId: BlockIdSchema,
  })
  .strict();

export type DeleteBlockIntentDTO = z.infer<typeof DeleteBlockIntentSchema>;

/** Intention de réordonnancement des blocks d’une page (draft). */
export const ReorderBlocksIntentSchema = z
  .object({
    orderedBlockIds: OrderedBlockIdsIntentSchema,
  })
  .strict();

export type ReorderBlocksIntentDTO = z.infer<typeof ReorderBlocksIntentSchema>;
