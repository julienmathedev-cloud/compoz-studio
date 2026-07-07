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
import type { z } from "zod";

export const UpdatePrimaryMenuSettingsIntentSchema =
  PrimaryMenuSettingsSchema.partial().strict();

export type UpdatePrimaryMenuSettingsIntentDTO = z.infer<
  typeof UpdatePrimaryMenuSettingsIntentSchema
>;
