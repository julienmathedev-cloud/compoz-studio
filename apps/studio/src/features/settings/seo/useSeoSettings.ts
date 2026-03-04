"use client";

/**
 * @file apps/studio/src/features/settings/seo/useSeoSettings.ts
 * @layer hooks/admin/site/seo
 *
 * @remarks
 * Option B (bundle read) :
 * - READ : provient du bundle global (React Query).
 * - WRITE : reste slice-by-slice (PATCH seo).
 * - Après un save : patch du cache bundle (seo) + invalidate status.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { DEFAULT_SEO_SETTINGS } from "@compoz/core/domain/site/defaults/seo";
import { settingsAdminApi } from "@compoz/infra/http/studio/site-settings.client";
import { useTenantId } from "@compoz/studio/features/admin/context/TenantContext";
import { patchSettingsBundleCache } from "@compoz/studio/features/settings/bundle/cache";
import { getSettingsBundle } from "@compoz/studio/features/settings/bundle/getSettingsBundle";
import type { SettingsHookResult } from "@compoz/studio/features/settings/hooks/useSettingsResource";
import {
  useSettingsResource,
  wrapSettingsSaveWithToasts,
} from "@compoz/studio/features/settings/hooks/useSettingsResource";
import {
  normalizeSeoFormValues,
  toSeoFormValuesFromDTO,
  toUpdateSeoIntentDTOFromFormValues,
} from "@compoz/studio/features/settings/mappers/seo-form";
import { invalidateSiteStatus } from "@compoz/studio/features/site/status/invalidate";
import { buildShallowDiff } from "@compoz/ui/lib/build-shallow-diff";
import type { SeoFormValues } from "@compoz/validation/site/settings/seo/seo-form";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

const DEFAULT_SEO_FORM_VALUES: SeoFormValues = normalizeSeoFormValues(
  toSeoFormValuesFromDTO(DEFAULT_SEO_SETTINGS),
);

type UseSeoSettingsResult = SettingsHookResult<SeoFormValues>;

export function useSeoSettings(): UseSeoSettingsResult {
  const t = useTranslations();
  const qc = useQueryClient();
  const entityLabel = t("admin.shared.entities.seo");
  const tenantId = useTenantId();

  const resource = useSettingsResource<SeoFormValues>({
    entityLabel,

    defaults: DEFAULT_SEO_FORM_VALUES,

    /** READ (bundle) : cache-first + fetchQuery fallback. */
    load: async (state: ContentState, opts) => {
      const bundle = await getSettingsBundle(qc, tenantId, state, opts);
      return normalizeSeoFormValues(toSeoFormValuesFromDTO(bundle.seo));
    },

    /** WRITE (slice PATCH, draft-only) + patch bundle cache. */
    save: async (next, opts) => {
      const patch = toUpdateSeoIntentDTOFromFormValues(next);
      const dto = await settingsAdminApi.seo.patch(patch, opts);

      patchSettingsBundleCache(qc, tenantId, WRITE_CONTENT_STATE, (prev) => ({
        ...prev,
        seo: dto.settings,
      }));

      return normalizeSeoFormValues(toSeoFormValuesFromDTO(dto.settings));
    },

    buildPatch: (baseline, next) =>
      buildShallowDiff(
        normalizeSeoFormValues(baseline),
        normalizeSeoFormValues(next),
      ) ?? null,

    onLoaded: normalizeSeoFormValues,
    beforeSave: normalizeSeoFormValues,

    onSaved: () => {
      void invalidateSiteStatus(qc, tenantId);
    },
  });

  return {
    ...resource,
    save: wrapSettingsSaveWithToasts<SeoFormValues>({
      t,
      entityLabel,
      save: resource.save,
    }),
  };
}
