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
 * - Uses the React Query AbortSignal for cancellable bundle reads.
 */

import { useQuery } from "@tanstack/react-query";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import { useWebsiteId } from "@compoz/studio/features/admin/website/WebsiteContext";
import {
  selectSettingsBundleSettings,
  settingsBundleQueryOptions,
} from "@compoz/studio/features/settings/bundle/query";

type UseSettingsBundleResult = ReturnType<typeof useQuery<SiteSettings, Error>>;

export function useSettingsBundle(
  state: ContentState,
): UseSettingsBundleResult {
  const websiteId = useWebsiteId();
  const enabled = Boolean(websiteId);

  return useQuery({
    ...settingsBundleQueryOptions(websiteId, state),
    enabled,
    select: selectSettingsBundleSettings,
  });
}

useSettingsBundle.displayName = "useSettingsBundle";
