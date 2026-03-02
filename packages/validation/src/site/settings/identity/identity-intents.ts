/**
 * @file packages/validation/src/site/settings/identity/identity-intents.ts
 * @layer schemas
 * @description
 * Définit les schémas Zod décrivant la forme frontière des intentions liées à l’identité du site.
 * Ces schémas valident uniquement la structure des payloads (API) ; les invariants métier
 * et règles de cohérence sont traités dans le domaine.
 */

import {
  IDENTITY_LOGOALT,
  IDENTITY_SITENAME,
} from "@compoz/core/constants/limits/identity";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { AssetUrlSchema } from "@compoz/validation/common/url-fragments";
import { IdentitySettingsBaseSchema } from "@compoz/validation/site/settings/identity/identity";
import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                                    Zod                                     */
/* -------------------------------------------------------------------------- */

/**
 * Valeur d’asset patchable : URL valide ou valeur de remise à zéro.
 * @remarks
 * - `""` : convention admin pour "vider" un champ contrôlé (UI string).
 * - `null` : remise à zéro explicite côté API.
 */
const AssetUrlPatchableSchema = z.union([
  AssetUrlSchema,
  z.literal(""),
  z.null(),
]);

/* -------------------------------------------------------------------------- */
/*                                   Intent                                   */
/* -------------------------------------------------------------------------- */

/**
 * Intention de mise à jour des réglages d’identité (draft-only).
 * Contrat : payload partiel aligné sur la forme des settings, avec gestion explicite
 * de la remise à zéro des assets.
 *
 * Note Zod :
 * - On ne peut pas faire `.partial()` sur un schema contenant des refinements.
 * - On dérive donc depuis `IdentitySettingsBaseSchema` (pur).
 */
export const UpdateIdentitySettingsIntentSchema =
  IdentitySettingsBaseSchema.partial()
    .extend({
      logoUrl: AssetUrlPatchableSchema.optional(),
      faviconUrl: AssetUrlPatchableSchema.optional(),
    })
    .superRefine((val, ctx) => {
      // Patch rule: si siteName est fourni, il doit respecter la règle "required min".
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

      // Patch rule: si logoUrl est fourni et correspond à un logo non vide,
      // alors logoAlt doit être fourni et valide dans ce payload.
      const hasLogoUrlInPayload = Object.prototype.hasOwnProperty.call(
        val,
        "logoUrl",
      );

      if (!hasLogoUrlInPayload) return;

      const logoUrl =
        typeof val.logoUrl === "string" ? val.logoUrl.trim() : null;

      const isSettingLogo =
        typeof logoUrl === "string" && logoUrl.trim().length > 0;

      // Si on "set" un logo (pas reset), on exige un logoAlt dans le payload patch.
      if (isSettingLogo) {
        const alt = typeof val.logoAlt === "string" ? val.logoAlt.trim() : "";
        if (alt.length < IDENTITY_LOGOALT.MIN) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["logoAlt"],
            message: ERROR_CODES.IDENTITY_LOGO_ALT_REQUIRED,
          });
        }
      }
    })
    .strict();

/**
 * DTO d’intention : résultat typé du parsing du payload de mise à jour.
 */
export type UpdateIdentitySettingsIntentDTO = z.infer<
  typeof UpdateIdentitySettingsIntentSchema
>;
