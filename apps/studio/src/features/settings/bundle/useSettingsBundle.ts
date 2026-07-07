"use client";

/**
 * @file apps/studio/src/features/settings/bundle/useSettingsBundle.ts
 * @layer studio/features/settings/bundle
 *
 * @description
 * React Query hook for reading the Studio settings bundle.
 *
 * @remarks
 * - Studio cache keys are scoped by Prisma Website.id and content state.
 * - Keeps previous data during refetches to avoid transient `undefined` states.
 */

import type { QueryFunctionContext } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import { settingsStudioApi } from "@compoz/infra/http/studio/site-settings.client";
import { useWebsiteId } from "@compoz/studio/features/admin/website/WebsiteContext";
import { settingsBundleKey } from "@compoz/studio/features/settings/bundle/keys";

type UseSettingsBundleResult = ReturnType<typeof useQuery<SiteSettings, Error>>;

export function useSettingsBundle(
  state: ContentState,
): UseSettingsBundleResult {
  const websiteId = useWebsiteId();
  const enabled = Boolean(websiteId);

  return useQuery({
    queryKey: settingsBundleKey(websiteId, state),
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

    // Avoids transient `data=undefined` states during refetch, HMR, or aborts.
    placeholderData: (previous: SiteSettings | undefined) => previous,
  });
}

useSettingsBundle.displayName = "useSettingsBundle";
