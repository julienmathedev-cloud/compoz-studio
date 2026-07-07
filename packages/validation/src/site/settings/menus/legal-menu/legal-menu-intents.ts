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
import type { z } from "zod";

export const UpdateLegalMenuSettingsIntentSchema =
  LegalMenuSettingsSchema.partial().strict();

export type UpdateLegalMenuSettingsIntentDTO = z.infer<
  typeof UpdateLegalMenuSettingsIntentSchema
>;
