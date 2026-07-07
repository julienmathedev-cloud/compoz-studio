"use client";

/**
 * @file apps/studio/src/features/settings/header/useHeaderSettings.ts
 * @layer studio/features/settings/header
 *
 * @description
 * Settings resource hook for loading and saving header settings.
 *
 * @remarks
 * - Reads from the settings bundle cache but saves through the header slice PATCH endpoint.
 * - Patches the settings bundle cache after save, then invalidates status and bundle queries.
 */

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import {
  DEFAULT_CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";
import { DEFAULT_HEADER_SETTINGS } from "@compoz/core/domain/site/defaults/header";
import { settingsStudioApi } from "@compoz/infra/http/studio/site-settings.client";
import { useWebsiteId } from "@compoz/studio/features/admin/website/WebsiteContext";
import { patchSettingsBundleCache } from "@compoz/studio/features/settings/bundle/cache";
import { getSettingsBundle } from "@compoz/studio/features/settings/bundle/getSettingsBundle";
import { settingsBundleKey } from "@compoz/studio/features/settings/bundle/keys";
import type { SettingsHookResult } from "@compoz/studio/features/settings/hooks/useSettingsResource";
import {
  useSettingsResource,
  wrapSettingsSaveWithToasts,
} from "@compoz/studio/features/settings/hooks/useSettingsResource";
import {
  normalizeHeaderFormValues,
  toHeaderFormValuesFromDTO,
  toUpdateHeaderIntentDTOFromFormValues,
} from "@compoz/studio/features/settings/mappers/header-form";
import { invalidateSiteStatus } from "@compoz/studio/features/site/status/invalidate";
import { buildShallowDiff } from "@compoz/ui/lib/build-shallow-diff";

import type { HeaderFormValues } from "@compoz/validation/site/settings/header/header-form";

type UseHeaderSettingsResult = SettingsHookResult<HeaderFormValues>;

export function useHeaderSettings(): UseHeaderSettingsResult {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const websiteId = useWebsiteId();

  const entityLabel = t("studio.shared.entities.header");

  const resource = useSettingsResource<HeaderFormValues>({
    entityLabel,

    defaults: normalizeHeaderFormValues(
      toHeaderFormValuesFromDTO(DEFAULT_HEADER_SETTINGS),
    ),

    load: async (state: ContentState) => {
      const bundle = await getSettingsBundle(queryClient, websiteId, state);

      return normalizeHeaderFormValues(
        toHeaderFormValuesFromDTO(bundle.header),
      );
    },

    // Saves through the slice endpoint while keeping the bundle cache aligned.
    save: async (next, opts) => {
      const patch = toUpdateHeaderIntentDTOFromFormValues(next);
      const dto = await settingsStudioApi.header.patch(patch, opts);

      patchSettingsBundleCache(
        queryClient,
        websiteId,
        DEFAULT_CONTENT_STATE,
        (previous) => ({
          ...previous,
          header: dto.settings,
        }),
      );

      return normalizeHeaderFormValues(toHeaderFormValuesFromDTO(dto.settings));
    },

    // Only send fields that changed after normalization.
    buildPatch: (baseline, next) =>
      buildShallowDiff(
        normalizeHeaderFormValues(baseline),
        normalizeHeaderFormValues(next),
      ) ?? null,

    onLoaded: normalizeHeaderFormValues,

    beforeSave: normalizeHeaderFormValues,

    // Keep client-side status and bundle reads aligned after the server-side save.
    onSaved: () => {
      void invalidateSiteStatus(queryClient, websiteId);

      void queryClient.invalidateQueries({
        queryKey: settingsBundleKey(websiteId, DEFAULT_CONTENT_STATE),
      });
    },
  });

  return {
    ...resource,
    save: wrapSettingsSaveWithToasts<HeaderFormValues>({
      t,
      entityLabel,
      save: resource.save,
    }),
  };
}

useHeaderSettings.displayName = "useHeaderSettings";
