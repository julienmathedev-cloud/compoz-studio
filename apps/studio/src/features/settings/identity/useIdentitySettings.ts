"use client";

/**
 * @file apps/studio/src/features/settings/identity/useIdentitySettings.ts
 * @layer studio/features/settings/identity
 *
 * @description
 * Settings resource hook for loading and saving identity settings.
 *
 * @remarks
 * - Reads from the settings bundle cache but saves through the identity slice PATCH endpoint.
 * - Patches the settings bundle cache after save, then invalidates status and bundle queries.
 */

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { DEFAULT_IDENTITY_SETTINGS } from "@compoz/core/domain/site/defaults/identity";
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
  normalizeIdentityFormValues,
  toIdentityFormValuesFromDTO,
  toUpdateIdentityIntentDTOFromFormValues,
} from "@compoz/studio/features/settings/mappers/identity-form";
import { invalidateSiteStatus } from "@compoz/studio/features/site/status/invalidate";
import { buildShallowDiff } from "@compoz/ui/lib/build-shallow-diff";

import type { IdentityFormValues } from "@compoz/validation/site/settings/identity/identity-form";

type UseIdentitySettingsResult = SettingsHookResult<IdentityFormValues>;

export function useIdentitySettings(): UseIdentitySettingsResult {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const websiteId = useWebsiteId();

  const entityLabel = t("studio.shared.entities.identity");

  const resource = useSettingsResource<IdentityFormValues>({
    entityLabel,

    defaults: normalizeIdentityFormValues(
      toIdentityFormValuesFromDTO(DEFAULT_IDENTITY_SETTINGS),
    ),

    // READ bundle : cache-first + fetchQuery fallback.
    load: async (state: ContentState) => {
      const bundle = await getSettingsBundle(queryClient, websiteId, state);

      return normalizeIdentityFormValues(
        toIdentityFormValuesFromDTO(bundle.settings.identity),
      );
    },

    // Saves through the slice endpoint while keeping the bundle cache aligned.
    save: async (next, opts) => {
      const patch = toUpdateIdentityIntentDTOFromFormValues(next);
      const dto = await settingsStudioApi.identity.patch(patch, opts);

      patchSettingsBundleCache(
        queryClient,
        websiteId,
        DEFAULT_CONTENT_STATE,
        {
          settings: {
            identity: dto.settings,
          },
        },
      );

      return normalizeIdentityFormValues(
        toIdentityFormValuesFromDTO(dto.settings),
      );
    },

    // Only send fields that changed after normalization.
    buildPatch: (baseline, next) =>
      buildShallowDiff(
        normalizeIdentityFormValues(baseline),
        normalizeIdentityFormValues(next),
      ) ?? null,

    onLoaded: normalizeIdentityFormValues,
    beforeSave: normalizeIdentityFormValues,

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
    save: wrapSettingsSaveWithToasts<IdentityFormValues>({
      t,
      entityLabel,
      save: resource.save,
    }),
  };
}

useIdentitySettings.displayName = "useIdentitySettings";
