"use client";

/**
 * @file apps/studio/src/features/settings/menus/primary-menu/usePrimaryMenuSettings.ts
 * @layer studio/features/settings/menus/primary-menu
 *
 * @description
 * Studio hook for loading, diffing, saving, and caching primary menu settings.
 *
 * @remarks
 * - Reads from the shared settings bundle cache, then writes only the `primaryMenu` slice through PATCH.
 * - Keeps RHF form values as the local editing shape and normalizes values at load/save boundaries.
 * - After save, patches the bundle cache and invalidates the site status read model.
 */

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useLayoutEffect, useRef } from "react";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { DEFAULT_PRIMARY_MENU_SETTINGS } from "@compoz/core/domain/site/defaults/primary-menu";
import { settingsStudioApi } from "@compoz/infra/http/studio/site-settings.client";
import { useWebsiteId } from "@compoz/studio/features/admin/website/WebsiteContext";
import {
  createRevisionedDraftSnapshot,
  requireCurrentSettingsOperation,
  throwIfSettingsOperationAborted,
} from "@compoz/studio/features/settings/_shared/revisioned-draft-snapshot";
import { patchSettingsBundleCache } from "@compoz/studio/features/settings/bundle/cache";
import { getSettingsBundle } from "@compoz/studio/features/settings/bundle/getSettingsBundle";
import { fetchFreshSettingsSection } from "@compoz/studio/features/settings/conflicts/fetch-fresh-settings-section";
import { primaryMenuConflictAdapter } from "@compoz/studio/features/settings/conflicts/settings-conflict-adapters";
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

type UsePrimaryMenuSettingsResult = SettingsHookResult<PrimaryMenuFormValues>;

export function usePrimaryMenuSettings(): UsePrimaryMenuSettingsResult {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const websiteId = useWebsiteId();
  const snapshot = useRef(
    createRevisionedDraftSnapshot<PrimaryMenuFormValues>(),
  ).current;
  const websiteIdRef = useRef(websiteId);

  useLayoutEffect(() => {
    websiteIdRef.current = websiteId;
  }, [websiteId]);

  const entityLabel = t("studio.shared.entities.primaryMenu");

  const resource = useSettingsResource<PrimaryMenuFormValues>({
    entityLabel,

    defaults: normalizePrimaryMenuFormValues(
      toPrimaryMenuFormValuesFromDTO(DEFAULT_PRIMARY_MENU_SETTINGS),
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

      const baseline = normalizePrimaryMenuFormValues(
        toPrimaryMenuFormValuesFromDTO(bundle.settings.primaryMenu),
      );

      return requireCurrentSettingsOperation(
        snapshot.commitLoad(load, {
          websiteId: capturedWebsiteId,
          baseline,
          revision: bundle.revisions.primaryMenuRevision,
          writable: state === DEFAULT_CONTENT_STATE,
          isWebsiteCurrent: () => websiteIdRef.current === capturedWebsiteId,
        }),
      );
    },

    /** Writes the primary menu slice, then mirrors the response into the settings bundle cache. */
    save: async (next, opts) => {
      const capturedWebsiteId = websiteIdRef.current;
      const capturedSnapshot = snapshot.captureForSave(capturedWebsiteId);

      if (!capturedSnapshot) {
        throw new Error(
          "Primary menu settings cannot be saved without a revisioned draft snapshot.",
        );
      }

      const patch = toUpdatePrimaryMenuIntentDTOFromFormValues(next);
      const dto = await settingsStudioApi.primaryMenu.patch(
        {
          baseline: capturedSnapshot.baseline,
          patch,
          expectedRevision: capturedSnapshot.expectedRevision,
        },
        opts,
      );
      throwIfSettingsOperationAborted(opts?.signal);

      const baseline = normalizePrimaryMenuFormValues(
        toPrimaryMenuFormValuesFromDTO(dto.settings),
      );

      patchSettingsBundleCache(
        queryClient,
        capturedWebsiteId,
        DEFAULT_CONTENT_STATE,
        {
          settings: {
            primaryMenu: dto.settings,
          },
          revisions: { primaryMenuRevision: dto.revision },
        },
      );

      return { value: requireCurrentSettingsOperation(
        snapshot.commitSave(capturedSnapshot, {
          websiteId: capturedWebsiteId,
          baseline,
          revision: dto.revision,
          isWebsiteCurrent: () => websiteIdRef.current === capturedWebsiteId,
        }),
      ), outcome: dto.outcome };
    },

    /** PATCH semantics: only changed form fields are sent to the API. */
    buildPatch: (baseline, next) =>
      buildShallowDiff(
        normalizePrimaryMenuFormValues(baseline),
        normalizePrimaryMenuFormValues(next),
      ) ?? null,

    onLoaded: normalizePrimaryMenuFormValues,

    beforeSave: normalizePrimaryMenuFormValues,

    conflict: {
      scope: "primary-menu",
      fetchCurrent: (signal) => fetchFreshSettingsSection({ signal, queryClient, websiteId: websiteIdRef.current, sectionKey: "primaryMenu", revisionKey: "primaryMenuRevision", toFormValues: (dto) => normalizePrimaryMenuFormValues(toPrimaryMenuFormValuesFromDTO(dto)) }),
      adoptSnapshot: (value, revision) => {
        const capturedWebsiteId = websiteIdRef.current;
        return requireCurrentSettingsOperation(snapshot.adoptAuthoritativeDraftWithRollback({ websiteId: capturedWebsiteId, baseline: value, revision, isWebsiteCurrent: () => websiteIdRef.current === capturedWebsiteId }));
      },
      presentation: primaryMenuConflictAdapter(t),
      messages: { freshReadFailed: t("studio.settingsConflict.errors.freshRead"), incomplete: t("studio.settingsConflict.errors.incomplete"), mutationFailed: t("studio.settingsConflict.errors.mutation") },
    },

    /** Keeps derived status and shared bundle queries aligned after a successful save. */
    onMutationResult: (_value, outcome) => {
      if (outcome === "updated") void invalidateSiteStatus(queryClient, websiteId);
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

usePrimaryMenuSettings.displayName = "usePrimaryMenuSettings";
