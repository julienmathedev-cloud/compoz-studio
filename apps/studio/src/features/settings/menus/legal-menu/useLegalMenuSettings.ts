"use client";

/**
 * @file apps/studio/src/features/settings/menus/legal-menu/useLegalMenuSettings.ts
 * @layer studio/features/settings/menus/legal-menu
 *
 * @description
 * Studio hook for loading, diffing, saving, and caching legal menu settings.
 *
 * @remarks
 * - Reads from the shared settings bundle cache, then writes only the `legalMenu` slice through PATCH.
 * - Keeps RHF form values as the local editing shape and normalizes values at load/save boundaries.
 * - After save, patches the bundle cache and invalidates the site status read model.
 */

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { DEFAULT_LEGAL_MENU_SETTINGS } from "@compoz/core/domain/site/defaults/legal-menu";
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
  normalizeLegalMenuFormValues,
  toLegalMenuFormValuesFromDTO,
  toUpdateLegalMenuIntentDTOFromFormValues,
} from "@compoz/studio/features/settings/mappers/legal-menu-form";
import { invalidateSiteStatus } from "@compoz/studio/features/site/status/invalidate";
import { buildShallowDiff } from "@compoz/ui/lib/build-shallow-diff";

import type { LegalMenuFormValues } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu-form";

type UseLegalMenuSettingsResult = SettingsHookResult<LegalMenuFormValues>;

export function useLegalMenuSettings(): UseLegalMenuSettingsResult {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const websiteId = useWebsiteId();

  const entityLabel = t("studio.shared.entities.legalMenu");

  const resource = useSettingsResource<LegalMenuFormValues>({
    entityLabel,

    defaults: normalizeLegalMenuFormValues(
      toLegalMenuFormValuesFromDTO(DEFAULT_LEGAL_MENU_SETTINGS),
    ),

    /** Shared bundle read with cache-first behavior handled by `getSettingsBundle`. */
    load: async (state: ContentState) => {
      const bundle = await getSettingsBundle(queryClient, websiteId, state);

      return normalizeLegalMenuFormValues(
        toLegalMenuFormValuesFromDTO(bundle.settings.legalMenu),
      );
    },

    /** Writes the legal menu slice, then mirrors the response into the settings bundle cache. */
    save: async (next, opts) => {
      const patch = toUpdateLegalMenuIntentDTOFromFormValues(next);
      const dto = await settingsStudioApi.legalMenu.patch(patch, opts);

      patchSettingsBundleCache(
        queryClient,
        websiteId,
        DEFAULT_CONTENT_STATE,
        {
          settings: {
            legalMenu: dto.settings,
          },
        },
      );

      return normalizeLegalMenuFormValues(
        toLegalMenuFormValuesFromDTO(dto.settings),
      );
    },

    /** PATCH semantics: only changed form fields are sent to the API. */
    buildPatch: (baseline, next) =>
      buildShallowDiff(
        normalizeLegalMenuFormValues(baseline),
        normalizeLegalMenuFormValues(next),
      ) ?? null,

    onLoaded: normalizeLegalMenuFormValues,

    beforeSave: normalizeLegalMenuFormValues,

    /** Keeps derived status and shared bundle queries aligned after a successful save. */
    onSaved: () => {
      void invalidateSiteStatus(queryClient, websiteId);

      void queryClient.invalidateQueries({
        queryKey: settingsBundleKey(websiteId, DEFAULT_CONTENT_STATE),
      });
    },
  });

  return {
    ...resource,
    save: wrapSettingsSaveWithToasts<LegalMenuFormValues>({
      t,
      entityLabel,
      save: resource.save,
    }),
  };
}

useLegalMenuSettings.displayName = "useLegalMenuSettings";
