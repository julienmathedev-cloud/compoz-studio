/**
 * @file apps/studio/src/features/settings/conflicts/fetch-fresh-settings-section.ts
 * @layer studio/features/settings/conflicts
 * @description Maps one authoritative no-cache bundle read to a section form snapshot.
 */

import type { QueryClient } from "@tanstack/react-query";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { SiteSettingsWithRevisionsDTO } from "@compoz/core/domain/site/dto";
import { patchSettingsBundleCache } from "@compoz/studio/features/settings/bundle/cache";
import { fetchFreshSettingsBundle } from "@compoz/studio/features/settings/bundle/fetchFreshSettingsBundle";
import type { FreshSettingsSection } from "@compoz/studio/features/settings/hooks/useSettingsResource";

export async function fetchFreshSettingsSection<
  TSectionKey extends keyof SiteSettingsWithRevisionsDTO["settings"],
  TRevisionKey extends keyof SiteSettingsWithRevisionsDTO["revisions"],
  TValues extends object,
>(input: Readonly<{
  signal: AbortSignal;
  queryClient: QueryClient;
  websiteId: string;
  sectionKey: TSectionKey;
  revisionKey: TRevisionKey;
  toFormValues: (dto: SiteSettingsWithRevisionsDTO["settings"][TSectionKey]) => TValues;
}>): Promise<FreshSettingsSection<TValues>> {
  const bundle = await fetchFreshSettingsBundle(DEFAULT_CONTENT_STATE, input.signal);
  const section = bundle.settings[input.sectionKey];
  const revision = bundle.revisions[input.revisionKey];
  return {
    value: input.toFormValues(section),
    revision,
    adoptCache: () => {
      patchSettingsBundleCache(
        input.queryClient,
        input.websiteId,
        DEFAULT_CONTENT_STATE,
        {
          settings: { [input.sectionKey]: section },
          revisions: { [input.revisionKey]: revision },
        },
      );
    },
  };
}
