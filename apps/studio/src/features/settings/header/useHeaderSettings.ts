"use client";

/**
 * @file apps/studio/src/features/settings/header/useHeaderSettings.ts
 * @layer hooks/admin/site/header
 *
 * @description
 * Hook admin spécialisé pour gérer les réglages du header via l’API.
 *
 * @remarks
 * - Basé sur le pattern **Settings RHF-first** (`useSettingsResource`).
 * - Travaille exclusivement sur le modèle **UI** (`HeaderFormValues`).
 * - Orchestration UI-only : defaults, load, diff minimal, save, notifications.
 * - Aucune logique métier ni validation domaine.
 *
 * Option B (bundle read) :
 * - READ : provient du bundle global (React Query).
 * - WRITE : reste slice-by-slice (PATCH header).
 * - Après un save : patch du cache bundle (header) + invalidate status.
 */

import { DEFAULT_HEADER_SETTINGS } from "@compoz/core/domain/site/defaults/header";
import { settingsAdminApi } from "@compoz/infra/http/studio/site-settings.client";
import { buildShallowDiff } from "@compoz/ui/lib/build-shallow-diff";
import { patchSettingsBundleCache } from "@compoz/studio/features/settings/bundle/cache";
import { getSettingsBundle } from "@compoz/studio/features/settings/bundle/getSettingsBundle";
import type { SettingsHookResult } from "@compoz/studio/features/settings/hooks/useSettingsResource";
import {
  useSettingsResource,
  wrapSettingsSaveWithToasts,
} from "@compoz/studio/features/settings/hooks/useSettingsResource";
import {
  normalizeHeaderFormValues,
  toHeaderFormValuesFromDTO,
  toUpdateHeaderIntentDTOFromFormValues,
} from "@compoz/studio/features/settings/mappers/header-form";
import { invalidateSiteStatus } from "@compoz/studio/features/site/status/invalidate";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { HeaderFormValues } from "@compoz/validation/site/settings/header/header-form";

/**
 * Alias du contrat de retour du hook `useHeaderSettings`.
 */
type UseHeaderSettingsResult = SettingsHookResult<HeaderFormValues>;

export function useHeaderSettings(): UseHeaderSettingsResult {
  const t = useTranslations();
  const qc = useQueryClient();
  const entityLabel = t("admin.shared.entities.header");

  const resource = useSettingsResource<HeaderFormValues>({
    entityLabel,

    /** Valeurs par défaut (domaine → UI → normalisation). */
    defaults: normalizeHeaderFormValues(
      toHeaderFormValuesFromDTO(DEFAULT_HEADER_SETTINGS),
    ),

    /** READ (bundle) : cache-first + fetchQuery fallback. */
    load: async (state: ContentState, opts) => {
      const bundle = await getSettingsBundle(qc, state, opts);
      return normalizeHeaderFormValues(
        toHeaderFormValuesFromDTO(bundle.header),
      );
    },

    /** WRITE (slice PATCH) + patch bundle cache. */
    save: async (next, opts) => {
      const patch = toUpdateHeaderIntentDTOFromFormValues(next);
      const dto = await settingsAdminApi.header.patch(patch, opts);

      patchSettingsBundleCache(qc, WRITE_CONTENT_STATE, (prev) => ({
        ...prev,
        header: dto.settings,
      }));

      return normalizeHeaderFormValues(toHeaderFormValuesFromDTO(dto.settings));
    },

    /** Diff minimal : ne renvoie que les champs réellement modifiés. */
    buildPatch: (baseline, next) =>
      buildShallowDiff(
        normalizeHeaderFormValues(baseline),
        normalizeHeaderFormValues(next),
      ) ?? null,

    /** Baseline stable et cohérente à l’entrée/sortie réseau. */
    onLoaded: normalizeHeaderFormValues,

    /** Normalisation safe avant diff/save. */
    beforeSave: normalizeHeaderFormValues,

    /** Après save : invalide le read-model "status". */
    onSaved: () => {
      void invalidateSiteStatus(qc);
    },
  });

  return {
    ...resource,
    save: wrapSettingsSaveWithToasts<HeaderFormValues>({
      t,
      entityLabel,
      save: resource.save,
    }),
  };
}
