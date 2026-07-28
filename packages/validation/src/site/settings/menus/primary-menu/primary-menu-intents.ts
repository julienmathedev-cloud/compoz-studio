/**
 * @file packages/validation/src/site/settings/menus/primary-menu/primary-menu-intents.ts
 * @layer schemas
 *
 * @description
 * Zod schema describing the primary menu settings update intent payload boundary.
 *
 * @remarks
 * This schema validates API payload shape only. Business invariants and
 * consistency rules are handled by the domain layer.
 */

import { PrimaryMenuSettingsSchema } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu";
import { z } from "zod";

export const UpdatePrimaryMenuSettingsIntentSchema = z.object({
  baseline: PrimaryMenuSettingsSchema,
  patch: PrimaryMenuSettingsSchema.partial().strict(),
  expectedRevision: z.number().int().nonnegative().optional(),
}).strict();

export type UpdatePrimaryMenuSettingsIntentDTO = z.infer<typeof UpdatePrimaryMenuSettingsIntentSchema>["patch"];
export type UpdatePrimaryMenuSettingsOCCIntentDTO = z.infer<
  typeof UpdatePrimaryMenuSettingsIntentSchema
>;
