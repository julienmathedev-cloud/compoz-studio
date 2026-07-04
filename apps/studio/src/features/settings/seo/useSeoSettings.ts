"use client";

/**
 * @file apps/studio/src/features/settings/seo/useSeoSettings.ts
 * @layer hooks/studio/site/seo
 *
 * @description
 * Hook Studio spécialisé pour gérer les réglages SEO via l’API.
 *
 * @remarks
 * - Basé sur le pattern Settings RHF-first (`useSettingsResource`).
 * - Travaille exclusivement sur le modèle UI (`SeoFormValues`).
 * - Draft-only.
 * - Orchestration UI-only : defaults, load, diff minimal, save, notifications.
 * - Aucune logique métier ni validation domaine.
 * - Le cache settings/status est scopé par Prisma Website.id.
 *
 * Option B, bundle read :
 * - READ : provient du bundle global React Query.
 * - WRITE : reste slice-by-slice via PATCH seo.
 * - Après un save : patch du cache bundle seo + invalidate status.
 */

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { DEFAULT_SEO_SETTINGS } from "@compoz/core/domain/site/defaults/seo";
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
  normalizeSeoFormValues,
  toSeoFormValuesFromDTO,
  toUpdateSeoIntentDTOFromFormValues,
} from "@compoz/studio/features/settings/mappers/seo-form";
import { invalidateSiteStatus } from "@compoz/studio/features/site/status/invalidate";
import { buildShallowDiff } from "@compoz/ui/lib/build-shallow-diff";

import type { SeoFormValues } from "@compoz/validation/site/settings/seo/seo-form";

const DEFAULT_SEO_FORM_VALUES: SeoFormValues = normalizeSeoFormValues(
  toSeoFormValuesFromDTO(DEFAULT_SEO_SETTINGS),
);

type UseSeoSettingsResult = SettingsHookResult<SeoFormValues>;

export function useSeoSettings(): UseSeoSettingsResult {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const websiteId = useWebsiteId();

  const entityLabel = t("studio.shared.entities.seo");

  const resource = useSettingsResource<SeoFormValues>({
    entityLabel,

    defaults: DEFAULT_SEO_FORM_VALUES,

    /**
     * READ bundle : cache-first + fetchQuery fallback.
     */
    load: async (state: ContentState) => {
      const bundle = await getSettingsBundle(queryClient, websiteId, state);

      return normalizeSeoFormValues(toSeoFormValuesFromDTO(bundle.seo));
    },

    /**
     * WRITE slice PATCH + patch bundle cache.
     */
    save: async (next, opts) => {
      const patch = toUpdateSeoIntentDTOFromFormValues(next);
      const dto = await settingsStudioApi.seo.patch(patch, opts);

      patchSettingsBundleCache(
        queryClient,
        websiteId,
        DEFAULT_CONTENT_STATE,
        (previous) => ({
          ...previous,
          seo: dto.settings,
        }),
      );

      return normalizeSeoFormValues(toSeoFormValuesFromDTO(dto.settings));
    },

    /**
     * Diff minimal : ne renvoie que les champs réellement modifiés.
     */
    buildPatch: (baseline, next) =>
      buildShallowDiff(
        normalizeSeoFormValues(baseline),
        normalizeSeoFormValues(next),
      ) ?? null,

    onLoaded: normalizeSeoFormValues,
    beforeSave: normalizeSeoFormValues,

    /**
     * Après save : invalide le read-model status et le bundle settings.
     */
    onSaved: () => {
      void invalidateSiteStatus(queryClient, websiteId);

      void queryClient.invalidateQueries({
        queryKey: settingsBundleKey(websiteId, DEFAULT_CONTENT_STATE),
      });
    },
  });

  return {
    ...resource,
    save: wrapSettingsSaveWithToasts<SeoFormValues>({
      t,
      entityLabel,
      save: resource.save,
    }),
  };
}

useSeoSettings.displayName = "useSeoSettings";
