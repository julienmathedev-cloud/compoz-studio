/**
 * @file packages/validation/src/site/settings/header/header-intents.ts
 * @layer schemas
 *
 * @description
 * Zod schema describing the header settings update intent payload boundary.
 *
 * @remarks
 * This schema validates API payload shape only. Business invariants and
 * consistency rules are handled by the domain layer.
 */

import { HeaderSettingsSchema } from "@compoz/validation/site/settings/header/header";
import type { z } from "zod";

export const UpdateHeaderSettingsIntentSchema =
  HeaderSettingsSchema.partial().strict();

export type UpdateHeaderSettingsIntentDTO = z.infer<
  typeof UpdateHeaderSettingsIntentSchema
>;
