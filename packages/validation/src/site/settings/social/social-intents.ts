/**
 * @file packages/validation/src/site/settings/social/social-intents.ts
 * @layer schemas
 *
 * @description
 * Zod schema describing the social settings update intent payload boundary.
 *
 * @remarks
 * This schema validates API payload shape only. Business invariants and
 * consistency rules are handled by the domain layer.
 */

import { SocialSettingsSchema } from "@compoz/validation/site/settings/social/social";
import { z } from "zod";

export const UpdateSocialSettingsIntentSchema = z.object({
  baseline: SocialSettingsSchema,
  patch: SocialSettingsSchema.partial().strict(),
  expectedRevision: z.number().int().nonnegative().optional(),
}).strict();

export type UpdateSocialSettingsIntentDTO = z.infer<typeof UpdateSocialSettingsIntentSchema>["patch"];
export type UpdateSocialSettingsOCCIntentDTO = z.infer<
  typeof UpdateSocialSettingsIntentSchema
>;
