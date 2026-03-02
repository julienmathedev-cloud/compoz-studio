"use client";

/**
 * @file apps/studio/src/features/settings/social/useSocialSettings.ts
 * @layer hooks/admin/site/social
 *
 * @description
 * Hook admin spécialisé pour gérer les réglages des réseaux sociaux via l’API.
 *
 * @remarks
 * - Basé sur le pattern **Settings RHF-first** (`useSettingsResource`).
 * - Travaille exclusivement sur le modèle **UI** (`SocialFormValues`).
 * - Draft-only : pas de gestion de state dans le hook.
 * - Orchestration UI-only : defaults, load, diff minimal, save, notifications.
 * - Mapping domaine ↔ UI assuré par des mappers dédiés.
 * - Aucune logique métier ni validation domaine.
 *
 * Option B (bundle read) :
 * - READ : provient du bundle global (React Query).
 * - WRITE : reste slice-by-slice (PATCH social).
 * - Après un save : patch du cache bundle (social) + invalidate status.
 */

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import type { ContentState } from "@compoz/core/constants/common/content-state";
import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { DEFAULT_SOCIAL_SETTINGS } from "@compoz/core/domain/site/defaults/social";
import { settingsAdminApi } from "@compoz/infra/http/studio/site-settings.client";
import { buildShallowDiff } from "@compoz/ui/lib/build-shallow-diff";
import type { SocialFormValues } from "@compoz/validation/site/settings/social/social-form";
import { patchSettingsBundleCache } from "@compoz/studio/features/settings/bundle/cache";
import { getSettingsBundle } from "@compoz/studio/features/settings/bundle/getSettingsBundle";
import type { SettingsHookResult } from "@compoz/studio/features/settings/hooks/useSettingsResource";
import {
  useSettingsResource,
  wrapSettingsSaveWithToasts,
} from "@compoz/studio/features/settings/hooks/useSettingsResource";
import {
  normalizeSocialFormValues,
  toSocialFormValuesFromDTO,
  toUpdateSocialIntentDTOFromFormValues,
} from "@compoz/studio/features/settings/mappers/social-form";
import { invalidateSiteStatus } from "@compoz/studio/features/site/status/invalidate";

type UseSocialSettingsResult = SettingsHookResult<SocialFormValues>;

export function useSocialSettings(): UseSocialSettingsResult {
  const t = useTranslations();
  const qc = useQueryClient();
  const entityLabel = t("admin.shared.entities.social");

  const resource = useSettingsResource<SocialFormValues>({
    entityLabel,

    /** Valeurs par défaut (domaine → UI → normalisation). */
    defaults: normalizeSocialFormValues(
      toSocialFormValuesFromDTO(DEFAULT_SOCIAL_SETTINGS),
    ),

    /** READ (bundle) : cache-first + fetchQuery fallback. */
    load: async (state: ContentState, opts) => {
      const bundle = await getSettingsBundle(qc, state, opts);
      return normalizeSocialFormValues(
        toSocialFormValuesFromDTO(bundle.social),
      );
    },

    /**
     * PATCH (draft-only) :
     * - `next` est un patch minimal (Partial) construit par `useSettingsResource`.
     * - on le transforme en intent API (trim/coercition) puis on PATCH.
     * - on remap la réponse en UI normalisée.
     */
    save: async (next, opts) => {
      const patch = toUpdateSocialIntentDTOFromFormValues(next);
      const dto = await settingsAdminApi.social.patch(patch, opts);

      patchSettingsBundleCache(qc, WRITE_CONTENT_STATE, (prev) => ({
        ...prev,
        social: dto.settings,
      }));

      return normalizeSocialFormValues(toSocialFormValuesFromDTO(dto.settings));
    },

    /** Diff minimal : ne renvoie que les champs réellement modifiés. */
    buildPatch: (baseline, next) =>
      buildShallowDiff(
        normalizeSocialFormValues(baseline),
        normalizeSocialFormValues(next),
      ) ?? null,

    /** Baseline stable et cohérente à l’entrée/sortie réseau. */
    onLoaded: normalizeSocialFormValues,

    /** Normalisation safe avant diff/save. */
    beforeSave: normalizeSocialFormValues,

    onSaved: () => {
      void invalidateSiteStatus(qc);
      // void invalidateSiteStatusDetails(qc);
    },
  });

  return {
    ...resource,
    save: wrapSettingsSaveWithToasts<SocialFormValues>({
      t,
      entityLabel,
      save: resource.save,
    }),
  };
}
