/**
 * @file packages/validation/src/site/settings/header/header.ts
 * @layer schemas
 *
 * @description
 * Zod schema describing the header settings boundary shape.
 *
 * @remarks
 * No defaults are applied here. Default values must be provided before this
 * boundary is validated.
 */

import { z } from "zod";

export const HeaderSettingsSchema = z
  .object({
    showLogo: z.boolean(),
    showSiteName: z.boolean(),
    sticky: z.boolean(),
    blur: z.boolean(),
    swapPrimaryAndSocial: z.boolean(),
  })
  .strict();

export type HeaderSettingsShape = z.infer<typeof HeaderSettingsSchema>;
