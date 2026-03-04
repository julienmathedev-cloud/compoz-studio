/**
 * @file apps/studio/src/features/settings/bundle/cache.ts
 * @layer hooks/admin/site/settings-bundle
 *
 * @description
 * Helpers de cache React Query pour le bundle de settings.
 *
 * @remarks
 * - Permet d’updater le bundle après un PATCH slice, sans invalidation globale.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type { QueryClient } from "@tanstack/react-query";

import { settingsBundleKey } from "@compoz/studio/features/settings/bundle/keys";

export function patchSettingsBundleCache(
  qc: QueryClient,
  tenantId: string,
  state: ContentState,
  patcher: (prev: SiteSettings) => SiteSettings,
) {
  qc.setQueryData(
    settingsBundleKey(tenantId, state),
    (prev: SiteSettings | undefined) => {
      if (!prev) return prev;
      return patcher(prev);
    },
  );
}
