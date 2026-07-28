"use client";

/**
 * @file apps/studio/src/features/settings/bundle/getSettingsBundle.ts
 * @layer studio/features/settings/bundle
 *
 * @description
 * Cache-first helper for reading the revisioned Studio settings bundle.
 *
 * @remarks
 * - Falls back to `fetchQuery` when the bundle is not already cached.
 * - Removes legacy or malformed cached projections before fetching canonical data.
 * - Studio cache keys are scoped by Prisma Website.id and content state.
 */

import type { QueryClient } from "@tanstack/react-query";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import type { SiteSettingsWithRevisionsDTO } from "@compoz/core/domain/site/dto";
import { settingsStudioApi } from "@compoz/infra/http/studio/site-settings.client";
import { isSettingsBundle } from "@compoz/studio/features/settings/bundle/cache";
import { settingsBundleKey } from "@compoz/studio/features/settings/bundle/keys";

function requireWebsiteId(value: unknown, field = "websiteId"): string {
  const websiteId = String(value ?? "").trim();

  if (!websiteId) {
    throw new Error(`${field} is required`);
  }

  return websiteId;
}

export async function getSettingsBundle(
  queryClient: QueryClient,
  websiteId: string,
  state: ContentState,
): Promise<SiteSettingsWithRevisionsDTO> {
  const websiteIdKey = requireWebsiteId(
    websiteId,
    "getSettingsBundle websiteId",
  );

  const key = settingsBundleKey(websiteIdKey, state);
  const cached = queryClient.getQueryData<unknown>(key);

  if (isSettingsBundle(cached)) {
    return cached;
  }

  if (cached !== undefined) {
    queryClient.removeQueries({
      queryKey: key,
      exact: true,
    });
  }

  return queryClient.fetchQuery<SiteSettingsWithRevisionsDTO>({
    queryKey: key,
    queryFn: async ({ signal }) => {
      const dto = await settingsStudioApi.bundle.get(state, {
        signal,
      });

      if (!isSettingsBundle(dto)) {
        throw new Error(
          "settings-bundle: invalid dto.settings or dto.revisions",
        );
      }

      return dto;
    },
  });
}

getSettingsBundle.displayName = "getSettingsBundle";
