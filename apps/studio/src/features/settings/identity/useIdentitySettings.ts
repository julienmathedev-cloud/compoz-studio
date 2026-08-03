"use client";

/**
 * @file apps/studio/src/features/settings/identity/useIdentitySettings.ts
 * @layer studio/features/settings/identity
 *
 * @description
 * Settings resource hook for loading and saving identity settings.
 *
 * @remarks
 * - Reads from the settings bundle cache but saves through the identity slice PATCH endpoint.
 * - Patches the settings bundle cache after save, then invalidates status and bundle queries.
 */

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useLayoutEffect, useRef } from "react";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { DEFAULT_IDENTITY_SETTINGS } from "@compoz/core/domain/site/defaults/identity";
import { settingsStudioApi } from "@compoz/infra/http/studio/site-settings.client";
import { useWebsiteId } from "@compoz/studio/features/admin/website/WebsiteContext";
import {
  createRevisionedDraftSnapshot,
  requireCurrentSettingsOperation,
  requireRevisionedDraftSave,
  throwIfSettingsOperationAborted,
} from "@compoz/studio/features/settings/_shared/revisioned-draft-snapshot";
import { patchSettingsBundleCache } from "@compoz/studio/features/settings/bundle/cache";
import { getSettingsBundle } from "@compoz/studio/features/settings/bundle/getSettingsBundle";
import { identityConflictAdapter } from "@compoz/studio/features/settings/conflicts/settings-conflict-adapters";
import { fetchFreshSettingsSection } from "@compoz/studio/features/settings/conflicts/fetch-fresh-settings-section";
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
import { buildShallowDiff } from "@compoz/ui/lib/build-shallow-diff";

import type { IdentityFormValues } from "@compoz/validation/site/settings/identity/identity-form";

type UseIdentitySettingsResult = SettingsHookResult<IdentityFormValues>;

export function useIdentitySettings(): UseIdentitySettingsResult {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const websiteId = useWebsiteId();
  const snapshot = useRef(
    createRevisionedDraftSnapshot<IdentityFormValues>(),
  ).current;
  const websiteIdRef = useRef(websiteId);

  useLayoutEffect(() => {
    websiteIdRef.current = websiteId;
  }, [websiteId]);

  const entityLabel = t("studio.shared.entities.identity");

  const resource = useSettingsResource<IdentityFormValues>({
    entityLabel,

    defaults: normalizeIdentityFormValues(
      toIdentityFormValuesFromDTO(DEFAULT_IDENTITY_SETTINGS),
    ),

    // READ bundle : cache-first + fetchQuery fallback.
    load: async (state: ContentState, opts) => {
      const load = snapshot.beginLoad();
      const capturedWebsiteId = websiteIdRef.current;
      const bundle = await getSettingsBundle(
        queryClient,
        capturedWebsiteId,
        state,
      );
      throwIfSettingsOperationAborted(opts?.signal);

      const baseline = normalizeIdentityFormValues(
        toIdentityFormValuesFromDTO(bundle.settings.identity),
      );

      return requireCurrentSettingsOperation(
        snapshot.commitLoad(load, {
          websiteId: capturedWebsiteId,
          baseline,
          revision: bundle.revisions.identityRevision,
          writable: state === DEFAULT_CONTENT_STATE,
          isWebsiteCurrent: () => websiteIdRef.current === capturedWebsiteId,
        }),
      );
    },

    // Saves through the slice endpoint while keeping the bundle cache aligned.
    save: async (next, opts) => {
      const capturedWebsiteId = websiteIdRef.current;
      const capturedSnapshot = requireRevisionedDraftSave(
        snapshot.captureForSave(capturedWebsiteId),
      );

      const patch = toUpdateIdentityIntentDTOFromFormValues(next);
      const dto = await settingsStudioApi.identity.patch(
        {
          baseline: capturedSnapshot.baseline,
          patch,
          expectedRevision: capturedSnapshot.expectedRevision,
        },
        opts,
      );
      throwIfSettingsOperationAborted(opts?.signal);

      const baseline = normalizeIdentityFormValues(
        toIdentityFormValuesFromDTO(dto.settings),
      );

      patchSettingsBundleCache(
        queryClient,
        capturedWebsiteId,
        DEFAULT_CONTENT_STATE,
        {
          settings: {
            identity: dto.settings,
          },
          revisions: { identityRevision: dto.revision },
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

    // Only send fields that changed after normalization.
    buildPatch: (baseline, next) =>
      buildShallowDiff(
        normalizeIdentityFormValues(baseline),
        normalizeIdentityFormValues(next),
      ) ?? null,

    onLoaded: normalizeIdentityFormValues,
    beforeSave: normalizeIdentityFormValues,

    conflict: {
      scope: "identity",
      fetchCurrent: (signal) => fetchFreshSettingsSection({
        signal,
        queryClient,
        websiteId: websiteIdRef.current,
        sectionKey: "identity",
        revisionKey: "identityRevision",
        toFormValues: (dto) => normalizeIdentityFormValues(toIdentityFormValuesFromDTO(dto)),
      }),
      adoptSnapshot: (value, revision) => {
        const capturedWebsiteId = websiteIdRef.current;
        return requireCurrentSettingsOperation(snapshot.adoptAuthoritativeDraftWithRollback({
          websiteId: capturedWebsiteId,
          baseline: value,
          revision,
          isWebsiteCurrent: () => websiteIdRef.current === capturedWebsiteId,
        }));
      },
      presentation: identityConflictAdapter(t),
      messages: {
        freshReadFailed: t("studio.settingsConflict.errors.freshRead"),
        incomplete: t("studio.settingsConflict.errors.incomplete"),
        mutationFailed: t("studio.settingsConflict.errors.mutation"),
      },
    },

    // Keep client-side status and bundle reads aligned after the server-side save.
    onMutationResult: (_value, outcome) => {
      if (outcome === "updated") void invalidateSiteStatus(queryClient, websiteId);
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

useIdentitySettings.displayName = "useIdentitySettings";
