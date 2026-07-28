"use client";

/**
 * @file apps/studio/src/features/settings/social/useSocialSettings.ts
 * @layer studio/features/settings/social
 *
 * @description
 * Studio hook for loading, diffing, saving, and caching social link settings.
 *
 * @remarks
 * - Reads from the shared settings bundle cache, then writes only the `social` slice through PATCH.
 * - Keeps RHF form values as the local editing shape and normalizes values at load/save boundaries.
 * - After save, patches the bundle cache and invalidates the site status read model.
 */

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useLayoutEffect, useRef } from "react";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { DEFAULT_SOCIAL_SETTINGS } from "@compoz/core/domain/site/defaults/social";
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
  normalizeSocialFormValues,
  toSocialFormValuesFromDTO,
  toUpdateSocialIntentDTOFromFormValues,
} from "@compoz/studio/features/settings/mappers/social-form";
import { invalidateSiteStatus } from "@compoz/studio/features/site/status/invalidate";
import { buildShallowDiff } from "@compoz/ui/lib/build-shallow-diff";

import type { SocialFormValues } from "@compoz/validation/site/settings/social/social-form";

type UseSocialSettingsResult = SettingsHookResult<SocialFormValues>;

export function useSocialSettings(): UseSocialSettingsResult {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const websiteId = useWebsiteId();
  const snapshot = useRef(
    createRevisionedDraftSnapshot<SocialFormValues>(),
  ).current;
  const websiteIdRef = useRef(websiteId);

  useLayoutEffect(() => {
    websiteIdRef.current = websiteId;
  }, [websiteId]);

  const entityLabel = t("studio.shared.entities.social");

  const resource = useSettingsResource<SocialFormValues>({
    entityLabel,

    defaults: normalizeSocialFormValues(
      toSocialFormValuesFromDTO(DEFAULT_SOCIAL_SETTINGS),
    ),

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

      const baseline = normalizeSocialFormValues(
        toSocialFormValuesFromDTO(bundle.settings.social),
      );

      return requireCurrentSettingsOperation(
        snapshot.commitLoad(load, {
          websiteId: capturedWebsiteId,
          baseline,
          revision: bundle.revisions.socialRevision,
          writable: state === DEFAULT_CONTENT_STATE,
          isWebsiteCurrent: () => websiteIdRef.current === capturedWebsiteId,
        }),
      );
    },

    /** Writes the social slice, then mirrors the response into the settings bundle cache. */
    save: async (next, opts) => {
      const capturedWebsiteId = websiteIdRef.current;
      const capturedSnapshot = snapshot.captureForSave(capturedWebsiteId);

      if (!capturedSnapshot) {
        throw new Error(
          "Social settings cannot be saved without a revisioned draft snapshot.",
        );
      }

      const patch = toUpdateSocialIntentDTOFromFormValues(next);
      const dto = await settingsStudioApi.social.patch(
        {
          baseline: capturedSnapshot.baseline,
          patch,
          expectedRevision: capturedSnapshot.expectedRevision,
        },
        opts,
      );
      throwIfSettingsOperationAborted(opts?.signal);

      const baseline = normalizeSocialFormValues(
        toSocialFormValuesFromDTO(dto.settings),
      );

      patchSettingsBundleCache(
        queryClient,
        capturedWebsiteId,
        DEFAULT_CONTENT_STATE,
        {
          settings: {
            social: dto.settings,
          },
          revisions: { socialRevision: dto.revision },
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
        normalizeSocialFormValues(baseline),
        normalizeSocialFormValues(next),
      ) ?? null,

    onLoaded: normalizeSocialFormValues,

    beforeSave: normalizeSocialFormValues,

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
    save: wrapSettingsSaveWithToasts<SocialFormValues>({
      t,
      entityLabel,
      save: resource.save,
    }),
  };
}

useSocialSettings.displayName = "useSocialSettings";
