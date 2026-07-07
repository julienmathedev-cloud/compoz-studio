/**
 * @file packages/validation/src/site/settings/footer/footer-intents.ts
 * @layer schemas
 *
 * @description
 * Zod schema describing the footer settings update intent payload boundary.
 *
 * @remarks
 * This schema validates API payload shape only. Business invariants and
 * consistency rules are handled by the domain layer.
 */

import { FooterSettingsSchema } from "@compoz/validation/site/settings/footer/footer";
import type { z } from "zod";

export const UpdateFooterSettingsIntentSchema =
  FooterSettingsSchema.partial().strict();

export type UpdateFooterSettingsIntentDTO = z.infer<
  typeof UpdateFooterSettingsIntentSchema
>;
