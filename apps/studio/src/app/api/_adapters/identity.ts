/**
 * @file apps/studio/src/app/api/_adapters/identity.ts
 * @layer api/adapters
 * @description
 * Adaptateur API Admin pour Identity :
 * convertit le DTO d’intention en input domaine pour le use-case.
 *
 * Responsabilités :
 * - trimming des champs texte
 * - normalisation des assets (logo / favicon)
 * - aucune logique métier
 * - aucun handling de state (géré par la route)
 */

import { asAssetUrlOrNull } from "@compoz/core/domain/urls/derive";
import { log } from "@compoz/infra/lib/log";

import type { IdentitySettings } from "@compoz/core/domain/site/entities/identity";
import type { UpdateIdentitySettingsInput } from "@compoz/core/domain/site/use-cases/identity/update-identity-settings.types";
import type { UpdateIdentitySettingsIntentDTO } from "@compoz/validation/site/settings/identity/identity-intents";

export function adaptUpdateIdentityIntent(
  dto: UpdateIdentitySettingsIntentDTO,
): UpdateIdentitySettingsInput {
  const started = Date.now();

  log.debug("admin.adapter.identity.patch.start", {
    hasSiteName: typeof dto.siteName === "string",
    hasTagline: typeof dto.tagline === "string",
    hasLogoAlt: typeof dto.logoAlt === "string",
    hasLogoUrl: dto.logoUrl !== undefined,
    hasFaviconUrl: dto.faviconUrl !== undefined,
  });

  const patch: Partial<IdentitySettings> = {};

  /* --------------------------- Champs texte --------------------------- */

  if (typeof dto.siteName === "string") {
    patch.siteName = dto.siteName.trim();
  }

  if (typeof dto.tagline === "string") {
    const v = dto.tagline.trim();
    patch.tagline = v.length === 0 ? undefined : v;
  }

  if (typeof dto.logoAlt === "string") {
    patch.logoAlt = dto.logoAlt.trim();
  }

  /* --------------------------- Assets --------------------------- */
  // Règles :
  // - undefined → inchangé
  // - null / "" → effacement
  // - string → normalisation
  if (dto.logoUrl !== undefined) {
    patch.logoUrl = asAssetUrlOrNull(dto.logoUrl);
  }

  if (dto.faviconUrl !== undefined) {
    patch.faviconUrl = asAssetUrlOrNull(dto.faviconUrl);
  }

  log.debug("admin.adapter.identity.patch.end", {
    ms: Date.now() - started,
    outKeys: Object.keys(patch),
  });

  return { patch };
}
