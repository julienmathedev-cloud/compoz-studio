/**
 * @file packages/validation/src/site/settings/identity/identity-form.ts
 * @layer schemas
 *
 * @description
 * Zod schema describing the identity settings UI form shape.
 */

import {
  IDENTITY_SITENAME,
  IDENTITY_TAGLINE,
} from "@compoz/core/constants/limits/identity";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { ImageSchema } from "@compoz/validation/common/image";
import { z } from "zod";

export const IdentityFormSchema = z
  .object({
    siteName: z
      .string()
      .trim()
      .max(IDENTITY_SITENAME.MAX, ERROR_CODES.IDENTITY_SITENAME_TOO_LONG),

    tagline: z
      .string()
      .trim()
      .max(IDENTITY_TAGLINE.MAX, ERROR_CODES.IDENTITY_TAGLINE_TOO_LONG),

    logo: z.union([ImageSchema, z.null()]),

    /**
     * Kept as a string so the favicon input remains controlled in the UI.
     */
    faviconUrl: z.string().trim(),

    faviconMediaAssetId: z.string().trim().min(1).optional(),
  })
  .strict()
  .superRefine((val, ctx) => {
    const siteName = val.siteName.trim();

    if (siteName.length < IDENTITY_SITENAME.MIN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["siteName"],
        message: ERROR_CODES.IDENTITY_SITENAME_REQUIRED,
      });
    }
  });

export type IdentityFormValues = z.infer<typeof IdentityFormSchema>;
