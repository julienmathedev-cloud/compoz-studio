/**
 * @file apps/studio/src/app/api/_adapters/social.ts
 * @layer studio/app/api/adapters
 *
 * @description
 * Studio API adapter for social settings update intents.
 *
 * @remarks
 * - Adapts social items only when `items` is present in the intent.
 * - Brands social URLs through `asBrandedHref` before domain writes.
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
 * Converts a social item DTO into a domain item.
 *
 * @remarks
 * Defensive trimming covers sources that do not come from RHF.
 */
function adaptSocialItem(dto: {
  id: string;
  kind: SocialItem["kind"];
  href: string;
}): SocialItem {
  return {
    id: trimOrKeep(dto.id),
    kind: dto.kind,
    href: asBrandedHref(trimOrKeep(dto.href)),
  };
}

/**
 * Converts a social settings intent into a partial domain patch.
 *
 * @remarks
 * Missing `items` does not reset the existing social links.
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
