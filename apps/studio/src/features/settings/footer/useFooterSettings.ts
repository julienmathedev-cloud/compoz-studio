"use client";

import {
  WRITE_CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";
import { DEFAULT_FOOTER_SETTINGS } from "@compoz/core/domain/site/defaults/footer";
/**
 * @file apps/studio/src/features/settings/footer/useFooterSettings.ts
 * @layer hooks/admin/site/footer
 *
 * @description
 * Hook admin spécialisé pour gérer les réglages du footer via l’API.
 *
 * @remarks
 * - Basé sur le pattern **Settings RHF-first** (`useSettingsResource`).
 * - Travaille exclusivement sur le modèle **UI** (`FooterFormValues`).
 * - Orchestration UI-only : defaults, load, diff minimal, save, notifications.
 * - Aucune logique métier ni validation domaine.
 */

import { settingsAdminApi } from "@compoz/infra/http/studio/site-settings.client";
import { buildShallowDiff } from "@compoz/ui/lib/build-shallow-diff";
import type { FooterFormValues } from "@compoz/validation/site/settings/footer/footer-form";
import { patchSettingsBundleCache } from "@compoz/studio/features/settings/bundle/cache";
import { getSettingsBundle } from "@compoz/studio/features/settings/bundle/getSettingsBundle";
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
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

/**
 * Alias du contrat de retour du hook `useFooterSettings`.
 */
type UseFooterSettingsResult = SettingsHookResult<FooterFormValues>;

export function useFooterSettings(): UseFooterSettingsResult {
  const t = useTranslations();
  const qc = useQueryClient();
  const entityLabel = t("admin.shared.entities.footer");

  const resource = useSettingsResource<FooterFormValues>({
    entityLabel,

    /** Valeurs par défaut (domaine → UI → normalisation). */
    defaults: normalizeFooterFormValues(
      toFooterFormValuesFromDTO(DEFAULT_FOOTER_SETTINGS),
    ),

    /** GET → DTO domaine → UI normalisée. */
    load: async (state: ContentState, opts) => {
      const bundle = await getSettingsBundle(qc, state, opts);
      return normalizeFooterFormValues(
        toFooterFormValuesFromDTO(bundle.footer),
      );
    },

    save: async (next, opts) => {
      const patch = toUpdateFooterIntentDTOFromFormValues(next);
      const dto = await settingsAdminApi.footer.patch(patch, opts);

      patchSettingsBundleCache(qc, WRITE_CONTENT_STATE, (prev) => ({
        ...prev,
        footer: dto.settings,
      }));

      return normalizeFooterFormValues(toFooterFormValuesFromDTO(dto.settings));
    },

    /** Diff minimal : ne renvoie que les champs réellement modifiés. */
    buildPatch: (baseline, next) =>
      buildShallowDiff(
        normalizeFooterFormValues(baseline),
        normalizeFooterFormValues(next),
      ) ?? null,

    /** Baseline stable et cohérente à l’entrée/sortie réseau. */
    onLoaded: normalizeFooterFormValues,

    /** Normalisation safe avant diff/save. */
    beforeSave: normalizeFooterFormValues,

    /**
     * Après un save : on invalide le read-model "status" (Overview badges).
     * - Côté serveur, le use-case a déjà invalidé le snapshot KV `status`.
     * - Côté client, on force React Query à refetch `useSiteStatus()`.
     */
    onSaved: () => {
      void invalidateSiteStatus(qc);
      // void invalidateSiteStatusDetails(qc);
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
