/**
 * @file apps/studio/src/app/api/_adapters/social.ts
 * @layer studio/app/api/adapters
 *
 * @description
 * Adaptateur API Studio pour les Social settings : transforme un intent DTO en patch partiel domaine.
 *
 * Responsabilités :
 * - adaptation des items SocialItem
 * - application uniquement des clés présentes
 * - branding des URL via `asBrandedHref`
 */

import type {
  SocialItem,
  SocialSettings,
} from "@compoz/core/domain/site/entities/social";
import type { UpdateSocialSettingsInput } from "@compoz/core/domain/site/use-cases/social/update-social-settings.types";
import { asBrandedHref } from "@compoz/core/domain/urls/href";
import { log } from "@compoz/infra/lib/log";
import { trimOrKeep } from "@compoz/studio/lib/strings";

import type { UpdateSocialSettingsIntentDTO } from "@compoz/validation/site/settings/social/social-intents";

/**
 * Transforme un SocialItem DTO en SocialItem domaine.
 *
 * Contrat :
 * - href est brandé via `asBrandedHref`
 * - trimming défensif (au cas où la source ne serait pas RHF)
 */
function adaptSocialItem(dto: {
  kind: SocialItem["kind"];
  href: string;
}): SocialItem {
  return {
    kind: dto.kind,
    href: asBrandedHref(trimOrKeep(dto.href)),
  };
}

/**
 * Transforme un intent DTO Social en patch partiel domaine `SocialSettings`.
 *
 * Contrat :
 * - `items` est adapté uniquement s’il est présent dans le DTO.
 * - Aucun reset implicite des autres champs.
 */
export function adaptUpdateSocialIntent(
  dto: UpdateSocialSettingsIntentDTO,
): UpdateSocialSettingsInput {
  const started = Date.now();

  log.debug("studio.adapter.social.patch.start", {
    hasItems: Array.isArray(dto.items),
    itemsCount: Array.isArray(dto.items) ? dto.items.length : undefined,
  });

  const patch: Partial<SocialSettings> = {};

  if (Array.isArray(dto.items)) {
    patch.items = dto.items.map(adaptSocialItem);
  }

  log.debug("studio.adapter.social.patch.end", {
    ms: Date.now() - started,
    outKeys: Object.keys(patch),
  });

  return { patch };
}
