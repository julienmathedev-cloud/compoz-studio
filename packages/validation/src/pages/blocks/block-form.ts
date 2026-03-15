/**
 * @file packages/validation/src/pages/blocks/block-form.ts
 * @layer schemas
 * @description
 * Schéma Zod décrivant la forme du formulaire UI d’édition d’un block Section.
 */

import { z } from "zod";

import {
  BlockNameSchema,
  BlockRowSchema,
  SectionBlockContainerModeSchema,
} from "@compoz/validation/pages/blocks/block";

/* -------------------------------------------------------------------------- */
/*                                   Form                                     */
/* -------------------------------------------------------------------------- */

export const SectionBlockFormSchema = z
  .object({
    name: BlockNameSchema,
    containerMode: SectionBlockContainerModeSchema,
    lcpPriority: z.boolean(),
    rows: z.array(BlockRowSchema),
  })
  .strict();

export type SectionBlockFormValues = z.infer<typeof SectionBlockFormSchema>;
