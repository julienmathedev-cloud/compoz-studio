/**
 * @file apps/studio/src/app/api/_adapters/header.ts
 * @layer studio/app/api/adapters
 *
 * @description
 * Adaptateur API Studio pour le Header :
 * convertit le DTO d’intention en input domaine pour le use-case.
 *
 * Responsabilités :
 * - copie défensive
 * - prise en compte uniquement des champs présents
 * - aucun traitement métier
 * - aucun handling de state (géré par la route)
 */

import { log } from "@compoz/infra/lib/log";

import type { HeaderSettings } from "@compoz/core/domain/site/entities/header";
import type { UpdateHeaderSettingsInput } from "@compoz/core/domain/site/use-cases/header/update-header-settings.types";
import type { UpdateHeaderSettingsIntentDTO } from "@compoz/validation/site/settings/header/header-intents";

export function adaptUpdateHeaderIntent(
  dto: UpdateHeaderSettingsIntentDTO,
): UpdateHeaderSettingsInput {
  const started = Date.now();

  log.debug("studio.adapter.header.patch.start", {
    hasShowLogo: typeof dto.showLogo === "boolean",
    hasShowSiteName: typeof dto.showSiteName === "boolean",
    hasSticky: typeof dto.sticky === "boolean",
    hasBlur: typeof dto.blur === "boolean",
    hasSwapPrimaryAndSocial: typeof dto.swapPrimaryAndSocial === "boolean",
  });

  const patch: Partial<HeaderSettings> = {};

  if (typeof dto.showLogo === "boolean") patch.showLogo = dto.showLogo;
  if (typeof dto.showSiteName === "boolean")
    patch.showSiteName = dto.showSiteName;
  if (typeof dto.sticky === "boolean") patch.sticky = dto.sticky;
  if (typeof dto.blur === "boolean") patch.blur = dto.blur;

  if (typeof dto.swapPrimaryAndSocial === "boolean") {
    patch.swapPrimaryAndSocial = dto.swapPrimaryAndSocial;
  }

  log.debug("studio.adapter.header.patch.end", {
    ms: Date.now() - started,
    outKeys: Object.keys(patch),
  });

  return { patch };
}
