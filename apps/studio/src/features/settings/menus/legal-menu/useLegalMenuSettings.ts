"use client";

/**
 * @file apps/studio/src/features/settings/menus/legal-menu/useLegalMenuSettings.ts
 * @layer hooks/studio/site/legal-menu
 *
 * @description
 * Hook Studio spécialisé pour gérer les réglages du menu légal via l’API.
 *
 * @remarks
 * - Basé sur le pattern Settings RHF-first (`useSettingsResource`).
 * - Travaille exclusivement sur le modèle UI (`LegalMenuFormValues`).
 * - Draft-only, comme Footer.
 * - Orchestration UI-only : defaults, load, diff minimal, save, notifications.
 * - Aucune logique métier ni validation domaine.
 * - Le cache settings/status est scopé par Prisma Website.id.
 *
 * Option B, bundle read :
 * - READ : provient du bundle global React Query.
 * - WRITE : reste slice-by-slice via PATCH legalMenu.
 * - Après un save : patch du cache bundle legalMenu + invalidate status.
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

    /**
     * Valeurs par défaut domaine → UI → normalisation.
     */
    defaults: normalizeLegalMenuFormValues(
      toLegalMenuFormValuesFromDTO(DEFAULT_LEGAL_MENU_SETTINGS),
    ),

    /**
     * READ bundle : cache-first + fetchQuery fallback.
     */
    load: async (state: ContentState) => {
      const bundle = await getSettingsBundle(queryClient, websiteId, state);

      return normalizeLegalMenuFormValues(
        toLegalMenuFormValuesFromDTO(bundle.legalMenu),
      );
    },

    /**
     * WRITE slice PATCH + patch bundle cache.
     *
     * `next` est un patch minimal construit par `useSettingsResource`.
     */
    save: async (next, opts) => {
      const patch = toUpdateLegalMenuIntentDTOFromFormValues(next);
      const dto = await settingsStudioApi.legalMenu.patch(patch, opts);

      patchSettingsBundleCache(
        queryClient,
        websiteId,
        DEFAULT_CONTENT_STATE,
        (previous) => ({
          ...previous,
          legalMenu: dto.settings,
        }),
      );

      return normalizeLegalMenuFormValues(
        toLegalMenuFormValuesFromDTO(dto.settings),
      );
    },

    /**
     * Diff minimal : ne renvoie que les champs réellement modifiés.
     */
    buildPatch: (baseline, next) =>
      buildShallowDiff(
        normalizeLegalMenuFormValues(baseline),
        normalizeLegalMenuFormValues(next),
      ) ?? null,

    /**
     * Baseline stable et cohérente à l’entrée/sortie réseau.
     */
    onLoaded: normalizeLegalMenuFormValues,

    /**
     * Normalisation safe avant diff/save.
     */
    beforeSave: normalizeLegalMenuFormValues,

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
    save: wrapSettingsSaveWithToasts<LegalMenuFormValues>({
      t,
      entityLabel,
      save: resource.save,
    }),
  };
}

useLegalMenuSettings.displayName = "useLegalMenuSettings";
