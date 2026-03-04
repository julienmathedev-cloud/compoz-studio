"use client";

/**
 * @file apps/studio/src/features/settings/menus/primary-menu/usePrimaryMenuSettings.ts
 * @layer hooks/admin/site/primary-menu
 *
 * @description
 * Hook admin spécialisé pour gérer les réglages du menu principal via l’API.
 *
 * @remarks
 * - Basé sur le pattern **Settings RHF-first** (`useSettingsResource`).
 * - Travaille exclusivement sur le modèle **UI** (`PrimaryMenuFormValues`).
 * - Draft-only (comme Footer/LegalMenu).
 * - Orchestration UI-only : defaults, load, diff minimal, save, notifications.
 * - Aucune logique métier ni validation domaine.
 *
 * Option B (bundle read) :
 * - READ : provient du bundle global (React Query).
 * - WRITE : reste slice-by-slice (PATCH primaryMenu).
 * - Après un save : patch du cache bundle (primaryMenu) + invalidate status.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { DEFAULT_PRIMARY_MENU_SETTINGS } from "@compoz/core/domain/site/defaults/primary-menu";
import { settingsAdminApi } from "@compoz/infra/http/studio/site-settings.client";
import { patchSettingsBundleCache } from "@compoz/studio/features/settings/bundle/cache";
import { getSettingsBundle } from "@compoz/studio/features/settings/bundle/getSettingsBundle";
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
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { useTenantId } from "@compoz/studio/features/admin/context/TenantContext";

type UsePrimaryMenuSettingsResult = SettingsHookResult<PrimaryMenuFormValues>;

export function usePrimaryMenuSettings(): UsePrimaryMenuSettingsResult {
  const t = useTranslations();
  const qc = useQueryClient();
  const entityLabel = t("admin.shared.entities.primaryMenu");
  const tenantId = useTenantId();

  const resource = useSettingsResource<PrimaryMenuFormValues>({
    entityLabel,

    /** Valeurs par défaut (domaine → UI → normalisation). */
    defaults: normalizePrimaryMenuFormValues(
      toPrimaryMenuFormValuesFromDTO(DEFAULT_PRIMARY_MENU_SETTINGS),
    ),

    /** READ (bundle) : cache-first + fetchQuery fallback. */
    load: async (state: ContentState, opts) => {
      const bundle = await getSettingsBundle(qc, tenantId, state, opts);
      return normalizePrimaryMenuFormValues(
        toPrimaryMenuFormValuesFromDTO(bundle.primaryMenu),
      );
    },

    /**
     * PATCH (draft-only) :
     * - `next` est un patch minimal (Partial) construit par `useSettingsResource`.
     * - on le transforme en patch API (intent) puis on PATCH.
     * - on remap la réponse en UI normalisée.
     */
    save: async (next, opts) => {
      const patch = toUpdatePrimaryMenuIntentDTOFromFormValues(next);
      const dto = await settingsAdminApi.primaryMenu.patch(patch, opts);

      patchSettingsBundleCache(qc, tenantId, WRITE_CONTENT_STATE, (prev) => ({
        ...prev,
        primaryMenu: dto.settings,
      }));

      return normalizePrimaryMenuFormValues(
        toPrimaryMenuFormValuesFromDTO(dto.settings),
      );
    },

    /** Diff minimal : ne renvoie que les champs réellement modifiés. */
    buildPatch: (baseline, next) =>
      buildShallowDiff(
        normalizePrimaryMenuFormValues(baseline),
        normalizePrimaryMenuFormValues(next),
      ) ?? null,

    /** Baseline stable et cohérente à l’entrée/sortie réseau. */
    onLoaded: normalizePrimaryMenuFormValues,

    /** Normalisation safe avant diff/save. */
    beforeSave: normalizePrimaryMenuFormValues,

    onSaved: () => {
      void invalidateSiteStatus(qc, tenantId);
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
