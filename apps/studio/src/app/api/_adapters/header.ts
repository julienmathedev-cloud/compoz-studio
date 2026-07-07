/**
 * @file apps/studio/src/app/api/_adapters/header.ts
 * @layer studio/app/api/adapters
 *
 * @description
 * Studio API adapter for header settings update intents.
 *
 * @remarks
 * - Builds a partial domain patch from the fields present in the intent.
 * - Leaves state handling to the route.
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
