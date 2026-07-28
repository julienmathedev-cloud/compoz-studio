"use client";

/**
 * @file apps/studio/src/features/settings/footer/useFooterSettings.ts
 * @layer studio/features/settings/footer
 *
 * @description
 * Settings resource hook for loading and saving footer settings.
 *
 * @remarks
 * - Builds minimal patches from normalized `FooterFormValues`.
 * - Patches the settings bundle cache after save, then invalidates status and bundle queries.
 */

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import {
  DEFAULT_CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";
import { DEFAULT_FOOTER_SETTINGS } from "@compoz/core/domain/site/defaults/footer";
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
  normalizeFooterFormValues,
  toFooterFormValuesFromDTO,
  toUpdateFooterIntentDTOFromFormValues,
} from "@compoz/studio/features/settings/mappers/footer-form";
import { invalidateSiteStatus } from "@compoz/studio/features/site/status/invalidate";
import { buildShallowDiff } from "@compoz/ui/lib/build-shallow-diff";

import type { FooterFormValues } from "@compoz/validation/site/settings/footer/footer-form";

type UseFooterSettingsResult = SettingsHookResult<FooterFormValues>;

export function useFooterSettings(): UseFooterSettingsResult {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const websiteId = useWebsiteId();

  const entityLabel = t("studio.shared.entities.footer");

  const resource = useSettingsResource<FooterFormValues>({
    entityLabel,

    defaults: normalizeFooterFormValues(
      toFooterFormValuesFromDTO(DEFAULT_FOOTER_SETTINGS),
    ),

    load: async (state: ContentState) => {
      const bundle = await getSettingsBundle(queryClient, websiteId, state);

      return normalizeFooterFormValues(
        toFooterFormValuesFromDTO(bundle.settings.footer),
      );
    },

    save: async (next, opts) => {
      const patch = toUpdateFooterIntentDTOFromFormValues(next);
      const dto = await settingsStudioApi.footer.patch(patch, opts);

      patchSettingsBundleCache(
        queryClient,
        websiteId,
        DEFAULT_CONTENT_STATE,
        {
          settings: {
            footer: dto.settings,
          },
        },
      );

      return normalizeFooterFormValues(toFooterFormValuesFromDTO(dto.settings));
    },

    // Only send fields that changed after normalization.
    buildPatch: (baseline, next) =>
      buildShallowDiff(
        normalizeFooterFormValues(baseline),
        normalizeFooterFormValues(next),
      ) ?? null,

    onLoaded: normalizeFooterFormValues,

    beforeSave: normalizeFooterFormValues,

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
    save: wrapSettingsSaveWithToasts<FooterFormValues>({
      t,
      entityLabel,
      save: resource.save,
    }),
  };
}

useFooterSettings.displayName = "useFooterSettings";
