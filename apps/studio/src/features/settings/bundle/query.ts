/**
 * @file apps/studio/src/features/settings/bundle/query.ts
 * @layer studio/features/settings/bundle
 *
 * @description
 * Canonical React Query definition for revisioned Studio settings bundles.
 */

import { queryOptions } from "@tanstack/react-query";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import type { SiteSettingsWithRevisionsDTO } from "@compoz/core/domain/site/dto";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import { fetchFreshSettingsBundle } from "@compoz/studio/features/settings/bundle/fetchFreshSettingsBundle";
import { settingsBundleKey } from "@compoz/studio/features/settings/bundle/keys";

export function settingsBundleQueryOptions(
  websiteId: string,
  state: ContentState,
) {
  return queryOptions({
    queryKey: settingsBundleKey(websiteId, state),
    queryFn: ({ signal }): Promise<SiteSettingsWithRevisionsDTO> =>
      fetchFreshSettingsBundle(state, signal),
  });
}

settingsBundleQueryOptions.displayName = "settingsBundleQueryOptions";

export function selectSettingsBundleSettings(
  bundle: SiteSettingsWithRevisionsDTO,
): SiteSettings {
  return bundle.settings;
}

selectSettingsBundleSettings.displayName = "selectSettingsBundleSettings";
