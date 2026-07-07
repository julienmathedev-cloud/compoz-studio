/**
 * @file packages/validation/src/pages/blocks/block-form.ts
 * @layer schemas
 *
 * @description
 * Zod schema describing the UI form shape used to edit section blocks.
 */

import { z } from "zod";

import {
  BlockCssClassNameSchema,
  BlockNameSchema,
  BlockRowSchema,
  SectionBlockContainerModeSchema,
} from "@compoz/validation/pages/blocks/block";

export const SectionBlockFormSchema = z
  .object({
    name: BlockNameSchema,
    containerMode: SectionBlockContainerModeSchema,
    cssClassName: BlockCssClassNameSchema,
    lcpPriority: z.boolean(),
    rows: z.array(BlockRowSchema),
  })
  .strict();

export type SectionBlockFormValues = z.infer<typeof SectionBlockFormSchema>;
