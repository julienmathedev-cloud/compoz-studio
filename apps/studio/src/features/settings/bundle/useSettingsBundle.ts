"use client";

/**
 * @file apps/studio/src/features/settings/bundle/useSettingsBundle.ts
 * @layer hooks/admin/site/settings-bundle
 *
 * @description
 * Hook React Query lisant le bundle complet des settings (read global).
 *
 * @remarks
 * - Utilisé comme source READ canonique pour les sections (Option B).
 * - Les sections font ensuite des PATCH slice et patchent le cache bundle.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import { settingsAdminApi } from "@compoz/infra/http/studio/site-settings.client";
import type { QueryFunctionContext } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import { settingsBundleKey } from "@compoz/studio/features/settings/bundle/keys";

export function useSettingsBundle(state: ContentState) {
  const options = {
    queryKey: settingsBundleKey(state),
    queryFn: async (
      ctx: QueryFunctionContext<ReturnType<typeof settingsBundleKey>>,
    ): Promise<SiteSettings> => {
      const dto = await settingsAdminApi.bundle.get(state, {
        signal: ctx.signal,
      });
      return dto.settings as SiteSettings;
    },

    /**
     * ✅ Conserve la dernière donnée connue pendant un refetch (dev/HMR/abort),
     * afin d'éviter les "flaps" data=undefined → sections qui passent temporairement en "vide".
     */
    placeholderData: (prev: SiteSettings | undefined) => prev,
  } as const;

  return useQuery(options);
}
