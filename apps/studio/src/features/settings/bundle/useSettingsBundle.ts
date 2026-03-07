"use client";

/**
 * @file apps/studio/src/features/settings/bundle/useSettingsBundle.ts
 * @layer hooks/studio/site/settings-bundle
 *
 * @description
 * Hook React Query lisant le bundle complet des settings (read global).
 *
 * @remarks
 * - Tenant-scoped : le cache inclut tenantId.
 * - Utilisé comme source READ canonique pour les sections (Option B).
 * - Les sections font ensuite des PATCH slice et patchent le cache bundle.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import { settingsStudioApi } from "@compoz/infra/http/studio/site-settings.client";
import type { QueryFunctionContext } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import { useTenantId } from "@compoz/studio/features/admin/tenant/TenantContext";
import { settingsBundleKey } from "@compoz/studio/features/settings/bundle/keys";

type UseSettingsBundleResult = ReturnType<typeof useQuery<SiteSettings, Error>>;

export function useSettingsBundle(
  state: ContentState,
): UseSettingsBundleResult {
  const tenantId = useTenantId();
  const enabled = Boolean(tenantId);

  return useQuery({
    queryKey: settingsBundleKey(tenantId, state),
    enabled,

    queryFn: async (
      ctx: QueryFunctionContext<ReturnType<typeof settingsBundleKey>>,
    ): Promise<SiteSettings> => {
      const dto = await settingsStudioApi.bundle.get(state, {
        signal: ctx.signal,
      });

      if (!dto?.settings) {
        throw new Error("settings-bundle: missing dto.settings");
      }

      return dto.settings as SiteSettings;
    },

    /**
     * ✅ Conserve la dernière donnée connue pendant un refetch (dev/HMR/abort),
     * afin d'éviter les "flaps" data=undefined → sections qui passent temporairement en "vide".
     */
    placeholderData: (prev: SiteSettings | undefined) => prev,
  });
}

useSettingsBundle.displayName = "useSettingsBundle";
