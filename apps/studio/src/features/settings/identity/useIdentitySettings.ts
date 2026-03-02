"use client";

/**
 * @file apps/studio/src/features/settings/identity/useIdentitySettings.ts
 * @layer hooks/admin/site/identity
 *
 * @description
 * Hook admin spécialisé pour gérer les réglages d’identité du site via l’API.
 *
 * @remarks
 * - Basé sur le pattern **Settings RHF-first** (`useSettingsResource`).
 * - Travaille exclusivement sur le modèle **UI** (`IdentityFormValues`).
 * - Orchestration UI-only : defaults, load, diff minimal, save, notifications.
 * - Mapping domaine ↔ UI assuré par des mappers dédiés.
 * - Aucune logique métier ni validation domaine.
 *
 * Option B (bundle read) :
 * - READ : provient du bundle global (React Query).
 * - WRITE : reste slice-by-slice (PATCH identity).
 * - Après un save : patch du cache bundle (identity) + invalidate status.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { DEFAULT_IDENTITY_SETTINGS } from "@compoz/core/domain/site/defaults/identity";
import { settingsAdminApi } from "@compoz/infra/http/studio/site-settings.client";
import { buildShallowDiff } from "@compoz/ui/lib/build-shallow-diff";
import type { IdentityFormValues } from "@compoz/validation/site/settings/identity/identity-form";
import { patchSettingsBundleCache } from "@compoz/studio/features/settings/bundle/cache";
import { getSettingsBundle } from "@compoz/studio/features/settings/bundle/getSettingsBundle";
import type { SettingsHookResult } from "@compoz/studio/features/settings/hooks/useSettingsResource";
import {
  useSettingsResource,
  wrapSettingsSaveWithToasts,
} from "@compoz/studio/features/settings/hooks/useSettingsResource";
import {
  normalizeIdentityFormValues,
  toIdentityFormValuesFromDTO,
  toUpdateIdentityIntentDTOFromFormValues,
} from "@compoz/studio/features/settings/mappers/identity-form";
import { invalidateSiteStatus } from "@compoz/studio/features/site/status/invalidate";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

type UseIdentitySettingsResult = SettingsHookResult<IdentityFormValues>;

export function useIdentitySettings(): UseIdentitySettingsResult {
  const t = useTranslations();
  const qc = useQueryClient();

  const entityLabel = t("admin.shared.entities.identity");

  const resource = useSettingsResource<IdentityFormValues>({
    entityLabel,

    defaults: normalizeIdentityFormValues(
      toIdentityFormValuesFromDTO(DEFAULT_IDENTITY_SETTINGS),
    ),

    /** READ (bundle) : cache-first + fetchQuery fallback. */
    load: async (state: ContentState, opts) => {
      const bundle = await getSettingsBundle(qc, state, opts);
      return normalizeIdentityFormValues(
        toIdentityFormValuesFromDTO(bundle.identity),
      );
    },

    save: async (next, opts) => {
      const patch = toUpdateIdentityIntentDTOFromFormValues(next);
      const dto = await settingsAdminApi.identity.patch(patch, opts);

      patchSettingsBundleCache(qc, WRITE_CONTENT_STATE, (prev) => ({
        ...prev,
        identity: dto.settings,
      }));

      return normalizeIdentityFormValues(
        toIdentityFormValuesFromDTO(dto.settings),
      );
    },

    buildPatch: (baseline, next) =>
      buildShallowDiff(
        normalizeIdentityFormValues(baseline),
        normalizeIdentityFormValues(next),
      ) ?? null,

    onLoaded: normalizeIdentityFormValues,
    beforeSave: normalizeIdentityFormValues,

    onSaved: () => {
      void invalidateSiteStatus(qc);
      // void invalidateSiteStatusDetails(qc);
    },
  });

  return {
    ...resource,
    save: wrapSettingsSaveWithToasts<IdentityFormValues>({
      t,
      entityLabel,
      save: resource.save,
    }),
  };
}
