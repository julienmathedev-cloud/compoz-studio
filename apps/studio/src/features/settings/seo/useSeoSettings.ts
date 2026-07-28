"use client";

/**
 * @file apps/studio/src/features/settings/seo/useSeoSettings.ts
 * @layer studio/features/settings/seo
 *
 * @description
 * Studio hook for loading, diffing, saving, and caching global SEO settings.
 *
 * @remarks
 * - Reads from the shared settings bundle cache, then writes only the `seo` slice through PATCH.
 * - Keeps RHF form values as the local editing shape and normalizes values at load/save boundaries.
 * - After save, patches the bundle cache and invalidates the site status read model.
 */

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useLayoutEffect, useRef } from "react";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { DEFAULT_SEO_SETTINGS } from "@compoz/core/domain/site/defaults/seo";
import { settingsStudioApi } from "@compoz/infra/http/studio/site-settings.client";
import { useWebsiteId } from "@compoz/studio/features/admin/website/WebsiteContext";
import {
  createRevisionedDraftSnapshot,
  requireCurrentSettingsOperation,
  throwIfSettingsOperationAborted,
} from "@compoz/studio/features/settings/_shared/revisioned-draft-snapshot";
import { patchSettingsBundleCache } from "@compoz/studio/features/settings/bundle/cache";
import { getSettingsBundle } from "@compoz/studio/features/settings/bundle/getSettingsBundle";
import { settingsBundleKey } from "@compoz/studio/features/settings/bundle/keys";
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

const DEFAULT_SEO_FORM_VALUES: SeoFormValues = normalizeSeoFormValues(
  toSeoFormValuesFromDTO(DEFAULT_SEO_SETTINGS),
);

type UseSeoSettingsResult = SettingsHookResult<SeoFormValues>;

export function useSeoSettings(): UseSeoSettingsResult {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const websiteId = useWebsiteId();
  const snapshot = useRef(
    createRevisionedDraftSnapshot<SeoFormValues>(),
  ).current;
  const websiteIdRef = useRef(websiteId);

  useLayoutEffect(() => {
    websiteIdRef.current = websiteId;
  }, [websiteId]);

  const entityLabel = t("studio.shared.entities.seo");

  const resource = useSettingsResource<SeoFormValues>({
    entityLabel,

    defaults: DEFAULT_SEO_FORM_VALUES,

    /** Shared bundle read with cache-first behavior handled by `getSettingsBundle`. */
    load: async (state: ContentState, opts) => {
      const load = snapshot.beginLoad();
      const capturedWebsiteId = websiteIdRef.current;
      const bundle = await getSettingsBundle(
        queryClient,
        capturedWebsiteId,
        state,
      );
      throwIfSettingsOperationAborted(opts?.signal);

      const baseline = normalizeSeoFormValues(
        toSeoFormValuesFromDTO(bundle.settings.seo),
      );

      return requireCurrentSettingsOperation(
        snapshot.commitLoad(load, {
          websiteId: capturedWebsiteId,
          baseline,
          revision: bundle.revisions.seoRevision,
          writable: state === DEFAULT_CONTENT_STATE,
          isWebsiteCurrent: () => websiteIdRef.current === capturedWebsiteId,
        }),
      );
    },

    /** Writes the SEO slice, then mirrors the response into the settings bundle cache. */
    save: async (next, opts) => {
      const capturedWebsiteId = websiteIdRef.current;
      const capturedSnapshot = snapshot.captureForSave(capturedWebsiteId);

      if (!capturedSnapshot) {
        throw new Error(
          "SEO settings cannot be saved without a revisioned draft snapshot.",
        );
      }

      const patch = toUpdateSeoIntentDTOFromFormValues(next);
      const dto = await settingsStudioApi.seo.patch(
        {
          baseline: capturedSnapshot.baseline,
          patch,
          expectedRevision: capturedSnapshot.expectedRevision,
        },
        opts,
      );
      throwIfSettingsOperationAborted(opts?.signal);

      const baseline = normalizeSeoFormValues(
        toSeoFormValuesFromDTO(dto.settings),
      );

      patchSettingsBundleCache(
        queryClient,
        capturedWebsiteId,
        DEFAULT_CONTENT_STATE,
        {
          settings: {
            seo: dto.settings,
          },
          revisions: { seoRevision: dto.revision },
        },
      );

      return requireCurrentSettingsOperation(
        snapshot.commitSave(capturedSnapshot, {
          websiteId: capturedWebsiteId,
          baseline,
          revision: dto.revision,
          isWebsiteCurrent: () => websiteIdRef.current === capturedWebsiteId,
        }),
      );
    },

    /** PATCH semantics: only changed form fields are sent to the API. */
    buildPatch: (baseline, next) =>
      buildShallowDiff(
        normalizeSeoFormValues(baseline),
        normalizeSeoFormValues(next),
      ) ?? null,

    onLoaded: normalizeSeoFormValues,
    beforeSave: normalizeSeoFormValues,

    /** Keeps derived status and shared bundle queries aligned after a successful save. */
    onSaved: () => {
      void invalidateSiteStatus(queryClient, websiteId);

      void queryClient.invalidateQueries({
        queryKey: settingsBundleKey(websiteId, DEFAULT_CONTENT_STATE),
      });
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

useSeoSettings.displayName = "useSeoSettings";
