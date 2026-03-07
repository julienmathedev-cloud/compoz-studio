/**
 * @file packages/ui/src/settings/mappers/identity-shape.ts
 * @layer ui/settings/mappers
 *
 * @description
 * Mapper "shared runtime" Identity :
 * - DTO domaine -> IdentitySettingsShape (frontière stable)
 *
 * @remarks
 * - Utilisé côté site (public) et côté studio (preview/renderer) dès que tu veux
 *   une shape frontière à partir d’un DTO.
 * - Pas d’intents API ici.
 * - Pas de logique RHF ici.
 */

import type { IdentitySettingsDTO } from "@compoz/core/domain/site/dto";
import type { IdentitySettingsShape } from "@compoz/validation/site/settings/identity/identity";

import {
  assetUiToSettings,
  emptyToUndef,
  trimKeepEmpty,
} from "@compoz/ui/lib/form-utils";

export function toIdentitySettingsShapeFromDTO(
  dto: IdentitySettingsDTO | null | undefined,
): IdentitySettingsShape {
  return {
    siteName: trimKeepEmpty(dto?.siteName), // peut être ""
    tagline: emptyToUndef(dto?.tagline),
    // assetUiToSettings accepte `string | null | undefined` (DTO ou FormValues)
    logoUrl: assetUiToSettings(dto?.logoUrl),
    logoAlt: emptyToUndef(dto?.logoAlt),
    faviconUrl: assetUiToSettings(dto?.faviconUrl),
  };
}
