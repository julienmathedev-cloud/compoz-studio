/**
 * @file apps/studio/src/features/settings/bundle/cache.ts
 * @layer hooks/studio/site/settings-bundle
 *
 * @description
 * Helpers de cache React Query pour le bundle de settings.
 *
 * @remarks
 * - Permet d’updater le bundle après un PATCH slice, sans invalidation globale.
 * - Le cache Studio est scopé par Prisma Website.id.
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
