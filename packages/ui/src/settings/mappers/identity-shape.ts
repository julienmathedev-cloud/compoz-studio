/**
 * @file packages/ui/src/settings/mappers/identity-shape.ts
 * @layer ui/settings/mappers
 *
 * @description
 * Maps identity settings DTOs to stable runtime identity settings shapes shared by site rendering and Studio preview.
 *
 * @remarks
 * API intents and form-oriented normalization stay outside this boundary mapper.
 */

import type { IdentitySettingsDTO } from "@compoz/core/domain/site/dto";
import type { IdentitySettingsShape } from "@compoz/validation/site/settings/identity/identity";

import { assetUiToSettings, trimKeepEmpty } from "@compoz/ui/lib/form-utils";

function optionalTrimmedString(
  value: string | null | undefined,
): string | undefined {
  const trimmed = trimKeepEmpty(value);

  return trimmed ? trimmed : undefined;
}

export function toIdentitySettingsShapeFromDTO(
  dto: IdentitySettingsDTO | null | undefined,
): IdentitySettingsShape {
  const logoMediaAssetId = optionalTrimmedString(dto?.logo?.mediaAssetId);

  return {
    siteName: trimKeepEmpty(dto?.siteName),
    tagline: dto?.tagline !== null ? trimKeepEmpty(dto?.tagline) : null,
    logo:
      dto?.logo !== null && dto?.logo !== undefined
        ? {
            src: trimKeepEmpty(dto.logo.src),
            alt: trimKeepEmpty(dto.logo.alt),
            width: dto.logo.width,
            height: dto.logo.height,
            ...(logoMediaAssetId ? { mediaAssetId: logoMediaAssetId } : {}),
          }
        : null,
    faviconUrl: assetUiToSettings(dto?.faviconUrl),
    faviconMediaAssetId: optionalTrimmedString(dto?.faviconMediaAssetId),
  };
}
