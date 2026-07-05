/**
 * @file apps/studio/src/features/settings/mappers/identity-form.ts
 * @layer ui-mappers/studio/site
 * @description
 * Mappers UI Identity (studio forms) :
 * - DTO -> valeurs de formulaire RHF
 * - normalisation UI
 * - PATCH intent DTO pour l’API studio
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

import { assetUiToPatch, trimKeepEmpty } from "@compoz/ui/lib/form-utils";
import { toIdentitySettingsShapeFromDTO } from "@compoz/ui/settings/mappers/identity-shape";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function optionalTrimmedString(
  value: string | null | undefined,
): string | undefined {
  const trimmed = trimKeepEmpty(value);

  return trimmed ? trimmed : undefined;
}

/* ----------------------- Domaine (DTO) -> UI (form values) ------------------ */

export function toIdentityFormValuesFromDTO(
  dto: IdentitySettingsDTO,
): IdentityFormValues {
  const logoMediaAssetId = optionalTrimmedString(dto.logo?.mediaAssetId);

  return {
    siteName: trimKeepEmpty(dto.siteName),
    tagline: trimKeepEmpty(dto.tagline),
    logo:
      dto.logo !== null
        ? {
            src: trimKeepEmpty(dto.logo.src),
            alt: trimKeepEmpty(dto.logo.alt),
            width: dto.logo.width,
            height: dto.logo.height,
            ...(logoMediaAssetId ? { mediaAssetId: logoMediaAssetId } : {}),
          }
        : null,
    faviconUrl: trimKeepEmpty(dto.faviconUrl),
  };
}

/* ------------------- Studio (RHF) -> Preview/Public (SettingsShape) ----------- */

export function toIdentitySettingsShapeFromFormValues(
  values: IdentityFormValues,
): IdentitySettingsShape {
  const logoMediaAssetId = optionalTrimmedString(values.logo?.mediaAssetId);

  const candidate = {
    siteName: trimKeepEmpty(values.siteName),
    tagline:
      values.tagline.trim().length > 0 ? trimKeepEmpty(values.tagline) : null,
    logo:
      values.logo !== null
        ? {
            src: trimKeepEmpty(values.logo.src),
            alt: trimKeepEmpty(values.logo.alt),
            width: values.logo.width,
            height: values.logo.height,
            ...(logoMediaAssetId ? { mediaAssetId: logoMediaAssetId } : {}),
          }
        : null,
    faviconUrl:
      values.faviconUrl.trim().length > 0
        ? trimKeepEmpty(values.faviconUrl)
        : null,
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
  const logoMediaAssetId = optionalTrimmedString(values.logo?.mediaAssetId);

  return {
    siteName: trimKeepEmpty(values.siteName),
    tagline: trimKeepEmpty(values.tagline),
    logo:
      values.logo !== null
        ? {
            src: trimKeepEmpty(values.logo.src),
            alt: trimKeepEmpty(values.logo.alt),
            width: values.logo.width,
            height: values.logo.height,
            ...(logoMediaAssetId ? { mediaAssetId: logoMediaAssetId } : {}),
          }
        : null,
    faviconUrl: trimKeepEmpty(values.faviconUrl),
  };
}

/* ------------------------------ UI -> PATCH (API) --------------------------- */

export function toUpdateIdentityIntentDTOFromFormValues(
  p: Partial<IdentityFormValues>,
): UpdateIdentitySettingsIntentDTO {
  const out: UpdateIdentitySettingsIntentDTO = {};

  if ("siteName" in p) {
    out.siteName = trimKeepEmpty(p.siteName);
  }

  if ("tagline" in p) {
    const tagline = trimKeepEmpty(p.tagline);
    out.tagline = tagline.length > 0 ? tagline : null;
  }

  if ("logo" in p) {
    const logoMediaAssetId = optionalTrimmedString(p.logo?.mediaAssetId);

    out.logo =
      p.logo !== null && p.logo !== undefined
        ? {
            src: trimKeepEmpty(p.logo.src),
            alt: trimKeepEmpty(p.logo.alt),
            width: p.logo.width,
            height: p.logo.height,
            ...(logoMediaAssetId ? { mediaAssetId: logoMediaAssetId } : {}),
          }
        : null;
  }

  if ("faviconUrl" in p) {
    out.faviconUrl = assetUiToPatch(p.faviconUrl);
  }

  return out;
}
