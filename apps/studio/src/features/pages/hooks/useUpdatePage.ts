"use client";

/**
 * @file apps/studio/src/features/pages/hooks/useUpdatePage.ts
 * @layer studio/features/pages/hooks
 *
 * @description
 * React Query mutation hook for updating a draft page through the pages Studio API.
 *
 * @remarks
 * - Builds a minimal API patch from the shallow diff between baseline and next UI values.
 * - Handles no-change cases before calling the API.
 * - Tracks the targeted update through `updatingPageId` so only the matching page is blocked.
 * - Seeds the page-by-id cache and updates the SiteIndex cache from the returned payload.
 * - Invalidates site and page status views after update.
 * - Studio cache keys are scoped by Prisma Website.id.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import type { PageDTO } from "@compoz/core/domain/pages/dto";
import { pagesStudioApi } from "@compoz/infra/http/studio/pages.client";
import type { UpdatePageResponse } from "@compoz/infra/http/studio/pages.types";
import { log } from "@compoz/infra/lib/log";
import { useWebsiteId } from "@compoz/studio/features/admin/website/WebsiteContext";
import { pageByIdKey } from "@compoz/studio/features/pages/cache/keys";
import { toUpdatePageIntentDTOFromFormValues } from "@compoz/studio/features/pages/mappers/pages-form";
import {
  adoptDraftStructureConflict,
  draftStructureMutationOptions,
  refreshMenuSettingsAfterConflict,
  requireDraftStructureSnapshot,
  resolveMenuRenameExpectedRevisions,
} from "@compoz/studio/features/pages/hooks/draft-structure-mutation";
import { adoptDraftStructurePagePatchCache } from "@compoz/studio/features/site-index/cache";
import { siteIndexKey } from "@compoz/studio/features/site-index/keys";
import { settingsBundleKey } from "@compoz/studio/features/settings/bundle/keys";
import {
  invalidatePageStatusViews,
  invalidateSiteStatus,
} from "@compoz/studio/features/site/status/invalidate";
import { notify } from "@compoz/studio/lib/ui/notify";
import {
  notifyNoChanges,
  notifyUpdated,
} from "@compoz/studio/lib/ui/notify-presets";
import { UiError } from "@compoz/studio/lib/ui/uiError";
import { withSaveLogs } from "@compoz/ui/hooks/instrumentation";
import { buildShallowDiff } from "@compoz/ui/lib/build-shallow-diff";

import type { PageFormValues } from "@compoz/validation/pages/page-form";
import type { UpdatePageIntentDTO } from "@compoz/validation/pages/page-intents";

type UpdatePageArgs = Readonly<{
  pageId: string;
  payload: UpdatePageIntentDTO;
  fields: ReadonlyArray<string>;
}>;

type UpdatePageMutationResult = Readonly<{
  pageId: string;
  nextSlug: string;
  fields: ReadonlyArray<string>;
  page: PageDTO;
  snapshot: Readonly<{
    index: UpdatePageResponse["index"];
    draftStructureRevision: number;
  }>;
}>;

type UseUpdatePageResult = Readonly<{
  update: (
    pageId: string,
    baseline: PageFormValues,
    next: PageFormValues,
  ) => Promise<void>;
  updatingPageId: string | null;
  isUpdating: boolean;
}>;

const logger = log.child({ ns: "hook", name: "useUpdatePage" });

export function useUpdatePage(onSuccess?: () => void): UseUpdatePageResult {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const websiteId = useWebsiteId();

  const entityLabel = t("studio.shared.entities.page");

  const [updatingPageId, setUpdatingPageId] = useState<string | null>(null);

  const mutationFn = async (
    args: UpdatePageArgs,
  ): Promise<UpdatePageMutationResult> => {
      const { pageId, payload, fields } = args;
      await queryClient.cancelQueries({
        queryKey: siteIndexKey(
          websiteId,
          DEFAULT_CONTENT_STATE,
        ),
        exact: true,
      });
      const requestPayload: UpdatePageIntentDTO = { ...payload };
      const structural = "parentId" in payload;
      if (structural) {
        requestPayload.expectedDraftStructureRevision =
          requireDraftStructureSnapshot(
            queryClient,
            websiteId,
          ).draftStructureRevision;
      }
      if ("slug" in payload) {
        Object.assign(
          requestPayload,
          await resolveMenuRenameExpectedRevisions(
            queryClient,
            websiteId,
          ),
        );
      }

      const response = await withSaveLogs(
        "useUpdatePage",
        DEFAULT_CONTENT_STATE,
        async () => {
          const result: UpdatePageResponse = await pagesStudioApi.update(
            pageId,
            requestPayload,
          );

          return result;
        },
        {
          entity: entityLabel,
          fields,
          pageId,
          websiteId,
        },
      );

      const page = response.page;
      const nextSlug = String(payload.slug ?? "").trim();

      return {
        pageId,
        nextSlug,
        fields,
        page,
        snapshot: {
          index: response.index,
          draftStructureRevision: response.draftStructureRevision,
        },
      } as const;
    };

  const handleSuccess = async ({
    pageId,
    nextSlug,
    fields,
    page,
    snapshot,
  }: UpdatePageMutationResult) => {
      notifyUpdated(
        t("notifications.updated.title", { entity: entityLabel }),
        t("notifications.updated.description", { fields: fields.join(", ") }),
      );

      adoptDraftStructurePagePatchCache(
        queryClient,
        websiteId,
        snapshot,
        page,
        DEFAULT_CONTENT_STATE,
      );

      queryClient.setQueryData(
        pageByIdKey(websiteId, pageId, DEFAULT_CONTENT_STATE),
        page,
      );

      const slugWasPatched = fields.includes("slug");

      await Promise.all([
        invalidateSiteStatus(queryClient, websiteId),
        invalidatePageStatusViews(queryClient, websiteId),
        ...(slugWasPatched
          ? [
              queryClient.invalidateQueries({
                queryKey: settingsBundleKey(
                  websiteId,
                  DEFAULT_CONTENT_STATE,
                ),
                refetchType: "all",
              }),
            ]
          : []),
      ]);

      logger.debug("update.ok", {
        websiteId,
        pageId,
        nextSlug,
        fields,
      });

      onSuccess?.();
    };

  const handleError = async (
    error: unknown,
    args: UpdatePageArgs,
  ) => {
      adoptDraftStructureConflict(queryClient, websiteId, error);
      if ("slug" in args.payload) {
        await refreshMenuSettingsAfterConflict(
          queryClient,
          websiteId,
          error,
        );
      }
      notify.fromError(error, UiError.unexpectedSave);

      logger.error("update.failed", {
        websiteId,
        msg: String(error),
      });
    };

  const handleSettled = () => {
      setUpdatingPageId(null);
    };

  const mutation = useMutation({
    ...draftStructureMutationOptions(websiteId),
    mutationFn,
    onSuccess: handleSuccess,
    onError: handleError,
    onSettled: handleSettled,
    retry: false,
  });

  const isPending = mutation.isPending;

  const update = useCallback(
    async (pageId: string, baseline: PageFormValues, next: PageFormValues) => {
      if (isPending) return;

      const pageIdKey = String(pageId ?? "").trim();

      if (!pageIdKey) {
        notify.error(
          t("uiErrors.errorGeneric"),
          t(ERROR_CODES.PAGE_ID_REQUIRED),
        );

        logger.error("update.invalidPageId", {
          websiteId,
          pageId,
        });

        return;
      }

      if (updatingPageId === pageIdKey) return;

      const uiPatch = buildShallowDiff<PageFormValues>(baseline, next) ?? null;

      if (!uiPatch) {
        notifyNoChanges(
          t("notifications.noChanges.title"),
          t("notifications.noChanges.description", { entity: entityLabel }),
        );

        return;
      }

      const payload = toUpdatePageIntentDTOFromFormValues(uiPatch);
      const fields = Object.keys(payload ?? {});

      if (fields.length === 0) {
        notifyNoChanges(
          t("notifications.noChanges.title"),
          t("notifications.noChanges.description", { entity: entityLabel }),
        );

        return;
      }

      setUpdatingPageId(pageIdKey);

      await mutation.mutateAsync({
        pageId: pageIdKey,
        payload,
        fields,
      });
    },
    [
      entityLabel,
      isPending,
      mutation,
      t,
      websiteId,
      updatingPageId,
    ],
  );

  return useMemo(
    () => ({
      update,
      updatingPageId,
      isUpdating: isPending,
    }),
    [update, updatingPageId, isPending],
  );
}

useUpdatePage.displayName = "useUpdatePage";
