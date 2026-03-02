/**
 * @file packages/validation/src/site/settings/identity/identity-intents.ts
 * @layer schemas
 * @description
 * Définit les schémas Zod décrivant la forme frontière des intentions liées à l’identité du site.
 * Ces schémas valident uniquement la structure des payloads (API) ; les invariants métier
 * et règles de cohérence sont traités dans le domaine.
 */

import { AssetUrlSchema } from "@compoz/validation/common/url-fragments";
import { IdentitySettingsSchema } from "@compoz/validation/site/settings/identity/identity";
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

/**
 * Intention de mise à jour des réglages d’identité (draft-only).
 * Contrat : payload partiel aligné sur la forme des settings, avec gestion explicite
 * de la remise à zéro des assets.
 */
export const UpdateIdentitySettingsIntentSchema =
  IdentitySettingsSchema.partial().strict().extend({
    logoUrl: AssetUrlPatchableSchema.optional(),
    faviconUrl: AssetUrlPatchableSchema.optional(),
  });

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

/**
 * DTO d’intention : résultat typé du parsing du payload de mise à jour.
 */
export type UpdateIdentitySettingsIntentDTO = z.infer<
  typeof UpdateIdentitySettingsIntentSchema
>;
