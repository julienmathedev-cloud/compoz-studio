/**
 * @file apps/studio/src/features/settings/mappers/identity-form.ts
 * @layer ui-mappers/site
 * @description
 * Mappers UI Identity (studio forms) :
 * - DTO -> valeurs de formulaire RHF
 * - normalisation UI
 * - PATCH intent DTO pour l’API admin
 *
 * @remarks
 * - Pour la shape runtime à partir d’un DTO : `toIdentitySettingsShapeFromDTO` (shared).
 * - Pour la shape runtime à partir du form : `toIdentitySettingsShapeFromFormValues`.
 */

import type { IdentitySettingsDTO } from "@compoz/core/domain/site/dto";
import {
  IdentitySettingsSchema,
  type IdentitySettingsShape,
} from "@compoz/validation/site/settings/identity/identity";
import type { IdentityFormValues } from "@compoz/validation/site/settings/identity/identity-form";
import type { UpdateIdentitySettingsIntentDTO } from "@compoz/validation/site/settings/identity/identity-intents";

import {
  assetUiToPatch,
  assetUiToSettings,
  emptyToUndef,
  trimKeepEmpty,
} from "@compoz/ui/lib/form-utils";

import { toIdentitySettingsShapeFromDTO } from "@compoz/ui/settings/mappers/identity-shape";

/* ----------------------- Domaine (DTO) -> UI (form values) ------------------ */

export function toIdentityFormValuesFromDTO(
  dto: IdentitySettingsDTO,
): IdentityFormValues {
  return {
    siteName: trimKeepEmpty(dto.siteName),
    tagline: trimKeepEmpty(dto.tagline),
    logoUrl: trimKeepEmpty(dto.logoUrl),
    logoAlt: trimKeepEmpty(dto.logoAlt),
    faviconUrl: trimKeepEmpty(dto.faviconUrl),
  };
}

/* ------------------- Admin (RHF) -> Preview/Public (SettingsShape) ----------- */

export function toIdentitySettingsShapeFromFormValues(
  values: IdentityFormValues,
): IdentitySettingsShape {
  const candidate = {
    siteName: trimKeepEmpty(values.siteName), // peut être ""
    tagline: emptyToUndef(values.tagline),
    logoUrl: assetUiToSettings(values.logoUrl),
    logoAlt: emptyToUndef(values.logoAlt),
    faviconUrl: assetUiToSettings(values.faviconUrl),
  } satisfies IdentitySettingsShape;

  const parsed = IdentitySettingsSchema.safeParse(candidate);
  return parsed.success ? parsed.data : candidate;
}

/**
 * DTO -> Shape (re-export studio convenience)
 *
 * @remarks
 * Optionnel : si tu veux éviter d’importer `@compoz/ui/site/mappers/identity-shape`
 * dans certains fichiers studio. Sinon, tu peux supprimer ce wrapper.
 */
export function toIdentitySettingsShape(
  dto: IdentitySettingsDTO,
): IdentitySettingsShape {
  return toIdentitySettingsShapeFromDTO(dto);
}

/* ---------------------------- Normalisations UI ---------------------------- */

export function normalizeIdentityFormValues(
  values: IdentityFormValues,
): IdentityFormValues {
  return {
    siteName: trimKeepEmpty(values.siteName),
    tagline: trimKeepEmpty(values.tagline),
    logoUrl: trimKeepEmpty(values.logoUrl),
    logoAlt: trimKeepEmpty(values.logoAlt),
    faviconUrl: trimKeepEmpty(values.faviconUrl),
  };
}

/* ------------------------------ UI -> PATCH (API) --------------------------- */

export function toUpdateIdentityIntentDTOFromFormValues(
  p: Partial<IdentityFormValues>,
): UpdateIdentitySettingsIntentDTO {
  const out: UpdateIdentitySettingsIntentDTO = {};

  if ("siteName" in p) out.siteName = trimKeepEmpty(p.siteName);

  // tagline : vide => undefined (cohérent avec le domaine)
  if ("tagline" in p) out.tagline = emptyToUndef(p.tagline);

  if ("logoUrl" in p) out.logoUrl = assetUiToPatch(p.logoUrl);
  if ("faviconUrl" in p) out.faviconUrl = assetUiToPatch(p.faviconUrl);

  if ("logoAlt" in p) out.logoAlt = emptyToUndef(p.logoAlt);

  return out;
}
