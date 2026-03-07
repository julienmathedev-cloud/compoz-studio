/**
 * @file apps/studio/src/app/api/_adapters/identity.ts
 * @layer studio/app/api/adapters
 *
 * @description
 * Adaptateur API Studio pour Identity :
 * convertit le DTO d’intention en input domaine pour le use-case.
 *
 * Responsabilités :
 * - trimming défensif (champs texte)
 * - normalisation des assets (logo / favicon)
 * - aucune logique métier
 * - aucun handling de state (géré par la route)
 */

import { asAssetUrlOrNull } from "@compoz/core/domain/urls/href";
import { log } from "@compoz/infra/lib/log";
import { trimOrKeep } from "@compoz/studio/lib/strings";

import type { IdentitySettings } from "@compoz/core/domain/site/entities/identity";
import type { UpdateIdentitySettingsInput } from "@compoz/core/domain/site/use-cases/identity/update-identity-settings.types";
import type { UpdateIdentitySettingsIntentDTO } from "@compoz/validation/site/settings/identity/identity-intents";

export function adaptUpdateIdentityIntent(
  dto: UpdateIdentitySettingsIntentDTO,
): UpdateIdentitySettingsInput {
  const started = Date.now();

  log.debug("studio.adapter.identity.patch.start", {
    hasSiteName: typeof dto.siteName === "string",
    hasTagline: typeof dto.tagline === "string",
    hasLogoAlt: typeof dto.logoAlt === "string",
    hasLogoUrl: dto.logoUrl !== undefined,
    hasFaviconUrl: dto.faviconUrl !== undefined,
  });

  const patch: Partial<IdentitySettings> = {};

  /* --------------------------- Champs texte --------------------------- */

  if (typeof dto.siteName === "string") {
    patch.siteName = trimOrKeep(dto.siteName);
  }

  if (typeof dto.tagline === "string") {
    const v = trimOrKeep(dto.tagline);
    patch.tagline = v.length === 0 ? undefined : v;
  }

  if (typeof dto.logoAlt === "string") {
    patch.logoAlt = trimOrKeep(dto.logoAlt);
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

  log.debug("studio.adapter.identity.patch.end", {
    ms: Date.now() - started,
    outKeys: Object.keys(patch),
  });

  return { patch };
}
