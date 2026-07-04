"use client";

/**
 * @file apps/studio/src/features/settings/footer/useFooterSettings.ts
 * @layer hooks/studio/site/footer
 *
 * @description
 * Hook Studio spécialisé pour gérer les réglages du footer via l’API.
 *
 * @remarks
 * - Basé sur le pattern Settings RHF-first (`useSettingsResource`).
 * - Travaille exclusivement sur le modèle UI (`FooterFormValues`).
 * - Orchestration UI-only : defaults, load, diff minimal, save, notifications.
 * - Aucune logique métier ni validation domaine.
 * - Le cache settings/status est scopé par Prisma Website.id.
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

    /**
     * Valeurs par défaut domaine → UI → normalisation.
     */
    defaults: normalizeFooterFormValues(
      toFooterFormValuesFromDTO(DEFAULT_FOOTER_SETTINGS),
    ),

    /**
     * GET bundle → DTO domaine → UI normalisée.
     */
    load: async (state: ContentState) => {
      const bundle = await getSettingsBundle(queryClient, websiteId, state);

      return normalizeFooterFormValues(
        toFooterFormValuesFromDTO(bundle.footer),
      );
    },

    save: async (next, opts) => {
      const patch = toUpdateFooterIntentDTOFromFormValues(next);
      const dto = await settingsStudioApi.footer.patch(patch, opts);

      patchSettingsBundleCache(
        queryClient,
        websiteId,
        DEFAULT_CONTENT_STATE,
        (previous) => ({
          ...previous,
          footer: dto.settings,
        }),
      );

      return normalizeFooterFormValues(toFooterFormValuesFromDTO(dto.settings));
    },

    /**
     * Diff minimal : ne renvoie que les champs réellement modifiés.
     */
    buildPatch: (baseline, next) =>
      buildShallowDiff(
        normalizeFooterFormValues(baseline),
        normalizeFooterFormValues(next),
      ) ?? null,

    /**
     * Baseline stable et cohérente à l’entrée/sortie réseau.
     */
    onLoaded: normalizeFooterFormValues,

    /**
     * Normalisation safe avant diff/save.
     */
    beforeSave: normalizeFooterFormValues,

    /**
     * Après un save :
     * - côté serveur, le use-case a invalidé le snapshot status ;
     * - côté client, on force React Query à refetch `useSiteStatus()`
     *   et le bundle settings courant.
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
    save: wrapSettingsSaveWithToasts<FooterFormValues>({
      t,
      entityLabel,
      save: resource.save,
    }),
  };
}

useFooterSettings.displayName = "useFooterSettings";
