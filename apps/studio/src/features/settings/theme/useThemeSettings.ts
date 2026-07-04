"use client";

/**
 * @file apps/studio/src/features/settings/theme/useThemeSettings.ts
 * @layer hooks/studio/site/theme
 *
 * @description
 * Hook Studio spécialisé pour gérer les réglages du thème public via l’API.
 *
 * @remarks
 * - Basé sur le pattern Settings RHF-first (`useSettingsResource`).
 * - Travaille exclusivement sur le modèle UI (`ThemeFormValues`).
 * - Orchestration UI-only : defaults, load, diff minimal, save, notifications.
 * - Aucune logique métier ni validation domaine.
 * - Le cache settings/status est scopé par Prisma Website.id.
 *
 * Option B, bundle read :
 * - READ : provient du bundle global React Query.
 * - WRITE : reste slice-by-slice via PATCH theme.
 * - Après un save : patch du cache bundle theme + invalidate status.
 */

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import {
  DEFAULT_CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";
import { DEFAULT_THEME_SETTINGS } from "@compoz/core/domain/site/defaults/theme";
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
  normalizeThemeFormValues,
  toThemeFormValuesFromDTO,
  toUpdateThemeIntentDTOFromFormValues,
} from "@compoz/studio/features/settings/mappers/theme-form";
import { invalidateSiteStatus } from "@compoz/studio/features/site/status/invalidate";
import { buildShallowDiff } from "@compoz/ui/lib/build-shallow-diff";

import type { ThemeFormValues } from "@compoz/validation/site/settings/theme/theme-form";

type UseThemeSettingsResult = SettingsHookResult<ThemeFormValues>;

export function useThemeSettings(): UseThemeSettingsResult {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const websiteId = useWebsiteId();

  const entityLabel = t("studio.shared.entities.theme");

  const resource = useSettingsResource<ThemeFormValues>({
    entityLabel,

    /**
     * Valeurs par défaut domaine → UI → normalisation.
     */
    defaults: normalizeThemeFormValues(
      toThemeFormValuesFromDTO(DEFAULT_THEME_SETTINGS),
    ),

    /**
     * READ bundle : cache-first + fetchQuery fallback.
     */
    load: async (state: ContentState) => {
      const bundle = await getSettingsBundle(queryClient, websiteId, state);

      return normalizeThemeFormValues(toThemeFormValuesFromDTO(bundle.theme));
    },

    /**
     * WRITE slice PATCH + patch bundle cache.
     */
    save: async (next, opts) => {
      const patch = toUpdateThemeIntentDTOFromFormValues(next);
      const dto = await settingsStudioApi.theme.patch(patch, opts);

      patchSettingsBundleCache(
        queryClient,
        websiteId,
        DEFAULT_CONTENT_STATE,
        (previous) => ({
          ...previous,
          theme: dto.settings,
        }),
      );

      return normalizeThemeFormValues(toThemeFormValuesFromDTO(dto.settings));
    },

    /**
     * Diff minimal : ne renvoie que les champs réellement modifiés.
     */
    buildPatch: (baseline, next) =>
      buildShallowDiff(
        normalizeThemeFormValues(baseline),
        normalizeThemeFormValues(next),
      ) ?? null,

    /**
     * Baseline stable et cohérente à l’entrée/sortie réseau.
     */
    onLoaded: normalizeThemeFormValues,

    /**
     * Normalisation safe avant diff/save.
     */
    beforeSave: normalizeThemeFormValues,

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
    save: wrapSettingsSaveWithToasts<ThemeFormValues>({
      t,
      entityLabel,
      save: resource.save,
    }),
  };
}

useThemeSettings.displayName = "useThemeSettings";
