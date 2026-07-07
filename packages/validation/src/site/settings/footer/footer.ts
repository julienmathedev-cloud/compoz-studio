/**
 * @file packages/validation/src/site/settings/footer/footer.ts
 * @layer schemas
 *
 * @description
 * Zod schema describing the footer settings boundary shape.
 *
 * @remarks
 * No defaults are applied here. Default values must be provided before this
 * boundary is validated.
 */

import { FOOTER_COPYRIGHT } from "@compoz/core/constants/limits/footer";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { z } from "zod";

export const FooterSettingsSchema = z
  .object({
    /**
     * Empty copyright is allowed intentionally.
     */
    copyright: z
      .string()
      .trim()
      .max(FOOTER_COPYRIGHT.MAX, ERROR_CODES.FOOTER_COPYRIGHT_TOO_LONG),

    showYear: z.boolean(),
  })
  .strict();

export type FooterSettingsShape = z.infer<typeof FooterSettingsSchema>;
