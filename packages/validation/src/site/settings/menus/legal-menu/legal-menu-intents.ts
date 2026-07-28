/**
 * @file packages/validation/src/site/settings/menus/legal-menu/legal-menu-intents.ts
 * @layer schemas
 *
 * @description
 * Zod schema describing the legal menu settings update intent payload boundary.
 *
 * @remarks
 * This schema validates API payload shape only. Business invariants and
 * consistency rules are handled by the domain layer.
 */

import { LegalMenuSettingsSchema } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu";
import { z } from "zod";

export const UpdateLegalMenuSettingsIntentSchema = z.object({
  baseline: LegalMenuSettingsSchema,
  patch: LegalMenuSettingsSchema.partial().strict(),
  expectedRevision: z.number().int().nonnegative().optional(),
}).strict();

export type UpdateLegalMenuSettingsIntentDTO = z.infer<typeof UpdateLegalMenuSettingsIntentSchema>["patch"];
export type UpdateLegalMenuSettingsOCCIntentDTO = z.infer<
  typeof UpdateLegalMenuSettingsIntentSchema
>;
