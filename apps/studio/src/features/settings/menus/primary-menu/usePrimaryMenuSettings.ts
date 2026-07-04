"use client";

/**
 * @file apps/studio/src/features/settings/menus/primary-menu/usePrimaryMenuSettings.ts
 * @layer hooks/studio/site/primary-menu
 *
 * @description
 * Hook Studio spécialisé pour gérer les réglages du menu principal via l’API.
 *
 * @remarks
 * - Basé sur le pattern Settings RHF-first (`useSettingsResource`).
 * - Travaille exclusivement sur le modèle UI (`PrimaryMenuFormValues`).
 * - Draft-only, comme Footer / LegalMenu.
 * - Orchestration UI-only : defaults, load, diff minimal, save, notifications.
 * - Aucune logique métier ni validation domaine.
 * - Le cache settings/status est scopé par Prisma Website.id.
 *
 * Option B, bundle read :
 * - READ : provient du bundle global React Query.
 * - WRITE : reste slice-by-slice via PATCH primaryMenu.
 * - Après un save : patch du cache bundle primaryMenu + invalidate status.
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

    /**
     * Valeurs par défaut domaine → UI → normalisation.
     */
    defaults: normalizePrimaryMenuFormValues(
      toPrimaryMenuFormValuesFromDTO(DEFAULT_PRIMARY_MENU_SETTINGS),
    ),

    /**
     * READ bundle : cache-first + fetchQuery fallback.
     */
    load: async (state: ContentState) => {
      const bundle = await getSettingsBundle(queryClient, websiteId, state);

      return normalizePrimaryMenuFormValues(
        toPrimaryMenuFormValuesFromDTO(bundle.primaryMenu),
      );
    },

    /**
     * WRITE slice PATCH + patch bundle cache.
     *
     * `next` est un patch minimal construit par `useSettingsResource`.
     */
    save: async (next, opts) => {
      const patch = toUpdatePrimaryMenuIntentDTOFromFormValues(next);
      const dto = await settingsStudioApi.primaryMenu.patch(patch, opts);

      patchSettingsBundleCache(
        queryClient,
        websiteId,
        DEFAULT_CONTENT_STATE,
        (previous) => ({
          ...previous,
          primaryMenu: dto.settings,
        }),
      );

      return normalizePrimaryMenuFormValues(
        toPrimaryMenuFormValuesFromDTO(dto.settings),
      );
    },

    /**
     * Diff minimal : ne renvoie que les champs réellement modifiés.
     */
    buildPatch: (baseline, next) =>
      buildShallowDiff(
        normalizePrimaryMenuFormValues(baseline),
        normalizePrimaryMenuFormValues(next),
      ) ?? null,

    /**
     * Baseline stable et cohérente à l’entrée / sortie réseau.
     */
    onLoaded: normalizePrimaryMenuFormValues,

    /**
     * Normalisation safe avant diff / save.
     */
    beforeSave: normalizePrimaryMenuFormValues,

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
    save: wrapSettingsSaveWithToasts<PrimaryMenuFormValues>({
      t,
      entityLabel,
      save: resource.save,
    }),
  };
}

usePrimaryMenuSettings.displayName = "usePrimaryMenuSettings";
