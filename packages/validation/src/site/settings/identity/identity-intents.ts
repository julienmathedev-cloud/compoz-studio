/**
 * @file packages/validation/src/site/settings/identity/identity-intents.ts
 * @layer schemas
 *
 * @description
 * Zod schema describing the identity settings update intent payload boundary.
 *
 * @remarks
 * This schema validates API payload shape only. Business invariants and
 * consistency rules are handled by the domain layer.
 */

import { IDENTITY_SITENAME } from "@compoz/core/constants/limits/identity";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { ImageSchema } from "@compoz/validation/common/image";
import { AssetUrlSchema } from "@compoz/validation/common/url-fragments";
import { IdentitySettingsBaseSchema } from "@compoz/validation/site/settings/identity/identity";
import { z } from "zod";

/**
 * Empty string and null are accepted to preserve explicit favicon clear flows.
 */
const AssetUrlPatchableSchema = z.union([
  AssetUrlSchema,
  z.literal(""),
  z.null(),
]);

const LogoPatchableSchema = z.union([ImageSchema, z.null()]);

export const UpdateIdentitySettingsIntentSchema =
  IdentitySettingsBaseSchema.partial()
    .extend({
      logo: LogoPatchableSchema.optional(),
      faviconUrl: AssetUrlPatchableSchema.optional(),
      faviconMediaAssetId: z.string().trim().min(1).optional(),
    })
    .superRefine((val, ctx) => {
      if (typeof val.siteName === "string") {
        const siteName = val.siteName.trim();

        if (siteName.length < IDENTITY_SITENAME.MIN) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["siteName"],
            message: ERROR_CODES.IDENTITY_SITENAME_REQUIRED,
          });
        }
      }
    })
    .strict();

export type UpdateIdentitySettingsIntentDTO = z.infer<
  typeof UpdateIdentitySettingsIntentSchema
>;
