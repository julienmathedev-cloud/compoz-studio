import {
  IDENTITY_SITENAME,
  IDENTITY_TAGLINE,
} from "@compoz/core/constants/limits/identity";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { ImageSchema } from "@compoz/validation/common/image";
import { AssetUrlSchema } from "@compoz/validation/common/url-fragments";
import { z } from "zod";

export const IdentitySettingsBaseSchema = z
  .object({
    siteName: z
      .string()
      .trim()
      .max(IDENTITY_SITENAME.MAX, ERROR_CODES.IDENTITY_SITENAME_TOO_LONG),

    tagline: z
      .string()
      .trim()
      .max(IDENTITY_TAGLINE.MAX, ERROR_CODES.IDENTITY_TAGLINE_TOO_LONG)
      .nullable(),

    logo: z.union([ImageSchema, z.null()]),

    faviconUrl: z.union([AssetUrlSchema, z.null()]),

    faviconMediaAssetId: z.string().trim().min(1).optional(),
  })
  .strict();

export const IdentitySettingsSchema = IdentitySettingsBaseSchema.superRefine(
  (val, ctx) => {
    const siteName = val.siteName.trim();

    if (siteName.length < IDENTITY_SITENAME.MIN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["siteName"],
        message: ERROR_CODES.IDENTITY_SITENAME_REQUIRED,
      });
    }
  },
);

export type IdentitySettingsShape = z.infer<typeof IdentitySettingsSchema>;
