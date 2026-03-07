"use client";

/**
 * @file apps/studio/src/features/settings/header/useHeaderSettings.ts
 * @layer hooks/studio/site/header
 *
 * @description
 * Hook Studio spécialisé pour gérer les réglages du header via l’API.
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

import {
  DEFAULT_CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";
import { DEFAULT_HEADER_SETTINGS } from "@compoz/core/domain/site/defaults/header";
import { settingsStudioApi } from "@compoz/infra/http/studio/site-settings.client";
import { useTenantId } from "@compoz/studio/features/admin/tenant/TenantContext";
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
import { buildShallowDiff } from "@compoz/ui/lib/build-shallow-diff";
import type { HeaderFormValues } from "@compoz/validation/site/settings/header/header-form";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

/**
 * Alias du contrat de retour du hook `useHeaderSettings`.
 */
type UseHeaderSettingsResult = SettingsHookResult<HeaderFormValues>;

export function useHeaderSettings(): UseHeaderSettingsResult {
  const t = useTranslations();
  const qc = useQueryClient();
  const entityLabel = t("studio.shared.entities.header");
  const tenantId = useTenantId();

  const resource = useSettingsResource<HeaderFormValues>({
    entityLabel,

    /** Valeurs par défaut (domaine → UI → normalisation). */
    defaults: normalizeHeaderFormValues(
      toHeaderFormValuesFromDTO(DEFAULT_HEADER_SETTINGS),
    ),

    /** READ (bundle) : cache-first + fetchQuery fallback. */
    load: async (state: ContentState, opts) => {
      const bundle = await getSettingsBundle(qc, tenantId, state, opts);

      return normalizeHeaderFormValues(
        toHeaderFormValuesFromDTO(bundle.header),
      );
    },

    /** WRITE (slice PATCH) + patch bundle cache. */
    save: async (next, opts) => {
      const patch = toUpdateHeaderIntentDTOFromFormValues(next);
      const dto = await settingsStudioApi.header.patch(patch, opts);

      patchSettingsBundleCache(qc, tenantId, DEFAULT_CONTENT_STATE, (prev) => ({
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
      void invalidateSiteStatus(qc, tenantId);
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

useHeaderSettings.displayName = "useHeaderSettings";
