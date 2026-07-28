"use client";

/**
 * @file apps/studio/src/features/settings/menus/primary-menu/usePrimaryMenuSettings.ts
 * @layer studio/features/settings/menus/primary-menu
 *
 * @description
 * Studio hook for loading, diffing, saving, and caching primary menu settings.
 *
 * @remarks
 * - Reads from the shared settings bundle cache, then writes only the `primaryMenu` slice through PATCH.
 * - Keeps RHF form values as the local editing shape and normalizes values at load/save boundaries.
 * - After save, patches the bundle cache and invalidates the site status read model.
 */

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { DEFAULT_PRIMARY_MENU_SETTINGS } from "@compoz/core/domain/site/defaults/primary-menu";
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
  normalizePrimaryMenuFormValues,
  toPrimaryMenuFormValuesFromDTO,
  toUpdatePrimaryMenuIntentDTOFromFormValues,
} from "@compoz/studio/features/settings/mappers/primary-menu-form";
import { invalidateSiteStatus } from "@compoz/studio/features/site/status/invalidate";
import { buildShallowDiff } from "@compoz/ui/lib/build-shallow-diff";

import type { PrimaryMenuFormValues } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu-form";

type UsePrimaryMenuSettingsResult = SettingsHookResult<PrimaryMenuFormValues>;

export function usePrimaryMenuSettings(): UsePrimaryMenuSettingsResult {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const websiteId = useWebsiteId();

  const entityLabel = t("studio.shared.entities.primaryMenu");

  const resource = useSettingsResource<PrimaryMenuFormValues>({
    entityLabel,

    defaults: normalizePrimaryMenuFormValues(
      toPrimaryMenuFormValuesFromDTO(DEFAULT_PRIMARY_MENU_SETTINGS),
    ),

    /** Shared bundle read with cache-first behavior handled by `getSettingsBundle`. */
    load: async (state: ContentState) => {
      const bundle = await getSettingsBundle(queryClient, websiteId, state);

      return normalizePrimaryMenuFormValues(
        toPrimaryMenuFormValuesFromDTO(bundle.settings.primaryMenu),
      );
    },

    /** Writes the primary menu slice, then mirrors the response into the settings bundle cache. */
    save: async (next, opts) => {
      const patch = toUpdatePrimaryMenuIntentDTOFromFormValues(next);
      const dto = await settingsStudioApi.primaryMenu.patch(patch, opts);

      patchSettingsBundleCache(
        queryClient,
        websiteId,
        DEFAULT_CONTENT_STATE,
        {
          settings: {
            primaryMenu: dto.settings,
          },
        },
      );

      return normalizePrimaryMenuFormValues(
        toPrimaryMenuFormValuesFromDTO(dto.settings),
      );
    },

    /** PATCH semantics: only changed form fields are sent to the API. */
    buildPatch: (baseline, next) =>
      buildShallowDiff(
        normalizePrimaryMenuFormValues(baseline),
        normalizePrimaryMenuFormValues(next),
      ) ?? null,

    onLoaded: normalizePrimaryMenuFormValues,

    beforeSave: normalizePrimaryMenuFormValues,

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
    save: wrapSettingsSaveWithToasts<PrimaryMenuFormValues>({
      t,
      entityLabel,
      save: resource.save,
    }),
  };
}

usePrimaryMenuSettings.displayName = "usePrimaryMenuSettings";
