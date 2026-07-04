"use client";

/**
 * @file apps/studio/src/features/settings/bundle/getSettingsBundle.ts
 * @layer hooks/studio/site/settings-bundle
 *
 * @description
 * Helper cache-first pour obtenir le bundle `SiteSettings`.
 *
 * @remarks
 * - Website-scoped : le cache inclut Prisma Website.id.
 * - Centralise la logique cache -> fetchQuery fallback.
 * - Utilisable depuis les hooks settings : footer/header/identity/etc.
 * - L’API résout le Website actif côté session/cookie.
 */

import type { QueryClient } from "@tanstack/react-query";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import { settingsStudioApi } from "@compoz/infra/http/studio/site-settings.client";
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
): Promise<SiteSettings> {
  const websiteIdKey = requireWebsiteId(
    websiteId,
    "getSettingsBundle websiteId",
  );

  const key = settingsBundleKey(websiteIdKey, state);

  const cached = queryClient.getQueryData<SiteSettings>(key);

  if (cached) return cached;

  const bundle = await queryClient.fetchQuery<SiteSettings>({
    queryKey: key,
    queryFn: async ({ signal }) => {
      const dto = await settingsStudioApi.bundle.get(state, {
        signal,
      });

      if (!dto?.settings) {
        throw new Error("settings-bundle: missing dto.settings");
      }

      return dto.settings as SiteSettings;
    },
  });

  return bundle;
}

getSettingsBundle.displayName = "getSettingsBundle";
