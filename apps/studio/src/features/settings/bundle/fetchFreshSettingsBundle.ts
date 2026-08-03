/**
 * @file apps/studio/src/features/settings/bundle/fetchFreshSettingsBundle.ts
 * @layer studio/features/settings/bundle
 * @description Authoritative settings bundle read isolated from React Query cache state.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import type { SiteSettingsWithRevisionsDTO } from "@compoz/core/domain/site/dto";
import { settingsStudioApi } from "@compoz/infra/http/studio/site-settings.client";
import { isSettingsBundle } from "@compoz/studio/features/settings/bundle/cache";
import { UiError } from "@compoz/studio/lib/ui/uiError";

export async function fetchFreshSettingsBundle(
  state: ContentState,
  signal?: AbortSignal,
): Promise<SiteSettingsWithRevisionsDTO> {
  const dto = await settingsStudioApi.bundle.get(state, { signal });
  if (!isSettingsBundle(dto)) {
    throw new Error(UiError.settingsBundleInvalid);
  }
  return dto;
}

fetchFreshSettingsBundle.displayName = "fetchFreshSettingsBundle";
