"use client";

/**
 * @file apps/studio/src/features/settings/bundle/getSettingsBundle.ts
 * @layer hooks/studio/site/settings-bundle
 *
 * @description
 * Helper "cache-first" pour obtenir le bundle SiteSettings.
 *
 * @remarks
 * - Tenant-scoped : le cache inclut tenantId.
 * - Centralise la logique cache -> fetchQuery fallback.
 * - Utilisable depuis les hooks settings (footer/header/identity/etc.).
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type { HttpOpts } from "@compoz/infra/http/internal";
import { settingsStudioApi } from "@compoz/infra/http/studio/site-settings.client";
import type { QueryClient } from "@tanstack/react-query";

import { requireTenantId } from "@compoz/ui/lib/tenant-id";

import { settingsBundleKey } from "@compoz/studio/features/settings/bundle/keys";

export async function getSettingsBundle(
  qc: QueryClient,
  tenantId: string,
  state: ContentState,
  opts?: HttpOpts,
): Promise<SiteSettings> {
  const tid = requireTenantId(tenantId);

  const key = settingsBundleKey(tid, state);

  const cached = qc.getQueryData<SiteSettings>(key);
  if (cached) return cached;

  const bundle = await qc.fetchQuery<SiteSettings>({
    queryKey: key,
    queryFn: async ({ signal }) => {
      const dto = await settingsStudioApi.bundle.get(state, {
        signal: opts?.signal ?? signal,
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
