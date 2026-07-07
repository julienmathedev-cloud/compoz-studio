/**
 * @file apps/studio/src/features/settings/bundle/cache.ts
 * @layer studio/features/settings/bundle
 *
 * @description
 * React Query cache helper for patching the Studio settings bundle.
 *
 * @remarks
 * - Updates the cached bundle after a slice PATCH without forcing a global invalidation.
 * - Studio cache keys are scoped by Prisma Website.id and content state.
 */

import type { QueryClient } from "@tanstack/react-query";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import { settingsBundleKey } from "@compoz/studio/features/settings/bundle/keys";

export function patchSettingsBundleCache(
  queryClient: QueryClient,
  websiteId: string,
  state: ContentState,
  patcher: (prev: SiteSettings) => SiteSettings,
) {
  queryClient.setQueryData(
    settingsBundleKey(websiteId, state),
    (prev: SiteSettings | undefined) => {
      if (!prev) return prev;

      return patcher(prev);
    },
  );
}

patchSettingsBundleCache.displayName = "patchSettingsBundleCache";
