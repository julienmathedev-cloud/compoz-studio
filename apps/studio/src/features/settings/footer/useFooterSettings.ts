"use client";

/**
 * @file apps/studio/src/features/settings/footer/useFooterSettings.ts
 * @layer studio/features/settings/footer
 *
 * @description
 * Settings resource hook for loading and saving footer settings.
 *
 * @remarks
 * - Builds minimal patches from normalized `FooterFormValues`.
 * - Patches the settings bundle cache after save, then invalidates status and bundle queries.
 */

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRef, useLayoutEffect } from "react";

import {
  DEFAULT_CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";
import { DEFAULT_FOOTER_SETTINGS } from "@compoz/core/domain/site/defaults/footer";
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
import { fetchFreshSettingsSection } from "@compoz/studio/features/settings/conflicts/fetch-fresh-settings-section";
import { footerConflictAdapter } from "@compoz/studio/features/settings/conflicts/settings-conflict-adapters";
import type { SettingsHookResult } from "@compoz/studio/features/settings/hooks/useSettingsResource";
import {
  useSettingsResource,
  wrapSettingsSaveWithToasts,
} from "@compoz/studio/features/settings/hooks/useSettingsResource";
import {
  normalizeFooterFormValues,
  toFooterFormValuesFromDTO,
  toUpdateFooterIntentDTOFromFormValues,
} from "@compoz/studio/features/settings/mappers/footer-form";
import { invalidateSiteStatus } from "@compoz/studio/features/site/status/invalidate";
import { buildShallowDiff } from "@compoz/ui/lib/build-shallow-diff";

import type { FooterFormValues } from "@compoz/validation/site/settings/footer/footer-form";

type UseFooterSettingsResult = SettingsHookResult<FooterFormValues>;

export function useFooterSettings(): UseFooterSettingsResult {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const websiteId = useWebsiteId();
  const snapshot = useRef(
    createRevisionedDraftSnapshot<FooterFormValues>(),
  ).current;
  const websiteIdRef = useRef(websiteId);

  useLayoutEffect(() => {
    websiteIdRef.current = websiteId;
  }, [websiteId]);

  const entityLabel = t("studio.shared.entities.footer");

  const resource = useSettingsResource<FooterFormValues>({
    entityLabel,

    defaults: normalizeFooterFormValues(
      toFooterFormValuesFromDTO(DEFAULT_FOOTER_SETTINGS),
    ),

    load: async (state: ContentState, opts) => {
      const load = snapshot.beginLoad();
      const capturedWebsiteId = websiteIdRef.current;
      const bundle = await getSettingsBundle(
        queryClient,
        capturedWebsiteId,
        state,
      );

      throwIfSettingsOperationAborted(opts?.signal);

      const baseline = normalizeFooterFormValues(
        toFooterFormValuesFromDTO(bundle.settings.footer),
      );

      return requireCurrentSettingsOperation(
        snapshot.commitLoad(load, {
          websiteId: capturedWebsiteId,
          baseline,
          revision: bundle.revisions.footerRevision,
          writable: state === DEFAULT_CONTENT_STATE,
          isWebsiteCurrent: () => websiteIdRef.current === capturedWebsiteId,
        }),
      );
    },

    save: async (next, opts) => {
      const capturedWebsiteId = websiteIdRef.current;
      const capturedSnapshot = requireRevisionedDraftSave(
        snapshot.captureForSave(capturedWebsiteId),
      );

      const intent = toUpdateFooterIntentDTOFromFormValues(
        capturedSnapshot.baseline,
        next,
        capturedSnapshot.expectedRevision,
      );
      const dto = await settingsStudioApi.footer.patch(intent, opts);
      throwIfSettingsOperationAborted(opts?.signal);

      const baseline = normalizeFooterFormValues(
        toFooterFormValuesFromDTO(dto.settings),
      );

      patchSettingsBundleCache(
        queryClient,
        capturedWebsiteId,
        DEFAULT_CONTENT_STATE,
        {
          settings: {
            footer: dto.settings,
          },
          revisions: {
            footerRevision: dto.revision,
          },
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
        normalizeFooterFormValues(baseline),
        normalizeFooterFormValues(next),
      ) ?? null,

    onLoaded: normalizeFooterFormValues,

    beforeSave: normalizeFooterFormValues,

    conflict: {
      scope: "footer",
      fetchCurrent: (signal) => fetchFreshSettingsSection({ signal, queryClient, websiteId: websiteIdRef.current, sectionKey: "footer", revisionKey: "footerRevision", toFormValues: (dto) => normalizeFooterFormValues(toFooterFormValuesFromDTO(dto)) }),
      adoptSnapshot: (value, revision) => {
        const capturedWebsiteId = websiteIdRef.current;
        return requireCurrentSettingsOperation(snapshot.adoptAuthoritativeDraftWithRollback({ websiteId: capturedWebsiteId, baseline: value, revision, isWebsiteCurrent: () => websiteIdRef.current === capturedWebsiteId }));
      },
      presentation: footerConflictAdapter(t),
      messages: { freshReadFailed: t("studio.settingsConflict.errors.freshRead"), incomplete: t("studio.settingsConflict.errors.incomplete"), mutationFailed: t("studio.settingsConflict.errors.mutation") },
    },

    // Keep client-side status and bundle reads aligned after the server-side save.
    onMutationResult: (_value, outcome) => {
      if (outcome === "updated") void invalidateSiteStatus(queryClient, websiteId);
    },
  });

  return {
    ...resource,
    save: wrapSettingsSaveWithToasts<FooterFormValues>({
      t,
      entityLabel,
      save: resource.save,
    }),
  };
}

useFooterSettings.displayName = "useFooterSettings";
