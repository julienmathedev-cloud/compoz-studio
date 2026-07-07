/**
 * @file apps/studio/src/features/settings/mappers/identity-form.ts
 * @layer studio/features/settings/mappers
 *
 * @description
 * Studio identity settings mappers for form values, preview shape, and API intents.
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

function optionalTrimmedString(
  value: string | null | undefined,
): string | undefined {
  const trimmed = trimKeepEmpty(value);

  return trimmed ? trimmed : undefined;
}
export function toIdentityFormValuesFromDTO(
  dto: IdentitySettingsDTO,
): IdentityFormValues {
  const logoMediaAssetId = optionalTrimmedString(dto.logo?.mediaAssetId);
  const faviconUrl = trimKeepEmpty(dto.faviconUrl);

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
    faviconUrl,
    faviconMediaAssetId: faviconUrl
      ? optionalTrimmedString(dto.faviconMediaAssetId)
      : undefined,
  };
}

export function toIdentitySettingsShapeFromFormValues(
  values: IdentityFormValues,
): IdentitySettingsShape {
  const logoMediaAssetId = optionalTrimmedString(values.logo?.mediaAssetId);
  const faviconUrl = trimKeepEmpty(values.faviconUrl);
  const faviconMediaAssetId = faviconUrl
    ? optionalTrimmedString(values.faviconMediaAssetId)
    : undefined;

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
    faviconUrl: faviconUrl.length > 0 ? faviconUrl : null,
    faviconMediaAssetId,
  } satisfies IdentitySettingsShape;

  const parsed = IdentitySettingsSchema.safeParse(candidate);
  return parsed.success ? parsed.data : candidate;
}

/** Re-exports the shared DTO-to-runtime-shape mapper for Studio callers. */
export function toIdentitySettingsShape(
  dto: IdentitySettingsDTO,
): IdentitySettingsShape {
  return toIdentitySettingsShapeFromDTO(dto);
}

export function normalizeIdentityFormValues(
  values: IdentityFormValues,
): IdentityFormValues {
  const logoMediaAssetId = optionalTrimmedString(values.logo?.mediaAssetId);
  const faviconUrl = trimKeepEmpty(values.faviconUrl);
  const faviconMediaAssetId = faviconUrl
    ? optionalTrimmedString(values.faviconMediaAssetId)
    : undefined;

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
    faviconUrl,
    faviconMediaAssetId,
  };
}

/** Builds a partial API intent while preserving PATCH semantics. */
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

  if ("faviconMediaAssetId" in p) {
    out.faviconMediaAssetId = optionalTrimmedString(p.faviconMediaAssetId);
  }

  /**
   * URL is the rendering source of truth.
   * If the favicon URL is explicitly cleared, the linked MediaAsset id must not
   * survive the patch, even if an outdated form value is still present.
   */
  if ("faviconUrl" in p && !out.faviconUrl) {
    out.faviconMediaAssetId = undefined;
  }

  return out;
}
