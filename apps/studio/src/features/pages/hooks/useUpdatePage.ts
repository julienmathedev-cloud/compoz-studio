"use client";

/**
 * @file apps/studio/src/features/pages/hooks/useUpdatePage.ts
 * @layer studio/features/pages/hooks
 * @description Revision-aware draft page metadata and parent mutation hook.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import type {
  PageWithRevisionsDTO,
} from "@compoz/core/domain/pages/dto";
import { pagesStudioApi } from "@compoz/infra/http/studio/pages.client";
import type { UpdatePageResponse } from "@compoz/infra/http/studio/pages.types";
import type { DraftStructureConflictDetails } from "@compoz/infra/lib/get-draft-structure-conflict-details";
import type { PageMetadataConflictDetails } from "@compoz/infra/lib/get-page-metadata-conflict-details";
import { log } from "@compoz/infra/lib/log";
import { useWebsiteId } from "@compoz/studio/features/admin/website/WebsiteContext";
import { pageByIdKey } from "@compoz/studio/features/pages/cache/keys";
import { adoptPageMetadataConflictCurrentCache } from "@compoz/studio/features/pages/cache/page-metadata-conflict-cache";
import {
  mergePageRevisionedSnapshot,
  patchPageStructureParent,
} from "@compoz/studio/features/pages/cache/page-snapshot";
import {
  adoptDraftStructureConflictDetails,
  draftStructureMutationOptions,
  requireDraftStructureSnapshot,
} from "@compoz/studio/features/pages/hooks/draft-structure-mutation";
import {
  shouldRunNormalPageUpdateSuccess,
  submitPageUpdateMutation,
  type PageUpdateCompletionMode,
  type UpdatePageSubmissionOutcome,
} from "@compoz/studio/features/pages/hooks/page-update-submission";
import { isAutomaticRevisionMerge } from "@compoz/studio/features/conflicts/occ-notifications";
import { invalidatePageMutationStatusViews } from "@compoz/studio/features/pages/hooks/invalidate-page-mutation-status-views";
import {
  normalizePageFormValues,
  toUpdatePageIntentDTOFromFormValues,
  type PageFormDirtyFields,
} from "@compoz/studio/features/pages/mappers/pages-form";
import {
  adoptDraftStructurePagePatchCache,
  patchDraftPageMetadataCache,
} from "@compoz/studio/features/site-index/cache";
import { siteIndexKey } from "@compoz/studio/features/site-index/keys";
import { settingsBundleKey } from "@compoz/studio/features/settings/bundle/keys";
import { notify } from "@compoz/studio/lib/ui/notify";
import {
  notifyAutomaticMerge,
  notifyNoChanges,
  notifyUpdated,
} from "@compoz/studio/lib/ui/notify-presets";
import { UiError } from "@compoz/studio/lib/ui/uiError";
import { withSaveLogs } from "@compoz/ui/hooks/instrumentation";
import type { PageFormValues } from "@compoz/validation/pages/page-form";
import type { UpdatePageIntentDTO } from "@compoz/validation/pages/page-intents";

export type PageEditBaseline = Readonly<{
  values: PageFormValues;
  metaRevision: number;
}>;

type UpdatePageArgs = Readonly<{
  pageId: string;
  payload: UpdatePageIntentDTO;
  fields: ReadonlyArray<string>;
  completion: PageUpdateCompletionMode;
}>;

export type UpdatePageMutationResult = Readonly<{
  pageId: string;
  payload: UpdatePageIntentDTO;
  fields: ReadonlyArray<string>;
  response: UpdatePageResponse;
  completion: UpdatePageArgs["completion"];
}>;

export type PageMetadataOnlyUpdateResult =
  | Readonly<{ status: "submitted"; response: UpdatePageResponse }>
  | Readonly<{ status: "noChanges" }>
  | Readonly<{ status: "metadataConflict" }>
  | Readonly<{ status: "ignored" }>;

type UseUpdatePageOptions = Readonly<{
  onSuccess?: (result: UpdatePageMutationResult) => void;
  onMetadataConflict?: (details: PageMetadataConflictDetails) => void;
  onStructureConflict?: (
    details: DraftStructureConflictDetails,
  ) => void;
}>;

type UseUpdatePageResult = Readonly<{
  update: (
    pageId: string,
    baseline: PageEditBaseline,
    next: PageFormValues,
    dirtyFields?: PageFormDirtyFields,
  ) => Promise<UpdatePageSubmissionOutcome>;
  resolveMetadataConflict: (
    pageId: string,
    baseline: PageEditBaseline,
    next: PageFormValues,
  ) => Promise<PageMetadataOnlyUpdateResult>;
  adoptMetadataConflictCurrent: (
    details: PageMetadataConflictDetails,
  ) => void;
  updatingPageId: string | null;
  isUpdating: boolean;
}>;

export type { UpdatePageSubmissionOutcome } from "@compoz/studio/features/pages/hooks/page-update-submission";

const logger = log.child({ ns: "hook", name: "useUpdatePage" });

export function useUpdatePage(
  options: UseUpdatePageOptions = {},
): UseUpdatePageResult {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const websiteId = useWebsiteId();
  const entityLabel = t("studio.shared.entities.page");
  const onMetadataConflict = options.onMetadataConflict;
  const onStructureConflict = options.onStructureConflict;
  const [updatingPageId, setUpdatingPageId] = useState<string | null>(null);

  const mutation = useMutation({
    ...draftStructureMutationOptions(websiteId),
    mutationFn: async (
      args: UpdatePageArgs,
    ): Promise<UpdatePageMutationResult> => {
      await queryClient.cancelQueries({
        queryKey: siteIndexKey(websiteId, DEFAULT_CONTENT_STATE),
        exact: true,
      });

      const response = await withSaveLogs(
        "useUpdatePage",
        DEFAULT_CONTENT_STATE,
        () => pagesStudioApi.update(args.pageId, args.payload),
        {
          entity: entityLabel,
          fields: args.fields,
          pageId: args.pageId,
          websiteId,
        },
      );

      return { ...args, response };
    },
    onSuccess: async (result) => {
      const { pageId, payload, fields, response } = result;
      const metadataChanges = payload.metadataChanges;
      const automaticMetadataMerge = response.outcome === "updated" &&
        metadataChanges !== undefined &&
        isAutomaticRevisionMerge(
          metadataChanges.expectedMetaRevision,
          response.revisions.metaRevision,
        );
      if (automaticMetadataMerge) {
        notifyAutomaticMerge(
          t("notifications.automaticMerge.title"),
          t("notifications.automaticMerge.description"),
        );
      } else if (response.outcome === "noChanges") {
        notifyNoChanges(
          t("notifications.noChanges.title"),
          t("notifications.noChanges.description", { entity: entityLabel }),
        );
      } else {
        notifyUpdated(
          t("notifications.updated.title", { entity: entityLabel }),
          t("notifications.updated.description", { fields: fields.join(", ") }),
        );
      }

      const incoming: PageWithRevisionsDTO = {
        page: response.page,
        revisions: response.revisions,
      };
      queryClient.setQueryData(
        pageByIdKey(websiteId, pageId, DEFAULT_CONTENT_STATE),
        (current: PageWithRevisionsDTO | undefined) => {
          const merged = mergePageRevisionedSnapshot(current, incoming);
          const structuralParent = response.structure?.index.pages.find(
            (item) => item.id === pageId,
          )?.parentId;

          return structuralParent === undefined
            ? merged
            : patchPageStructureParent(merged, structuralParent);
        },
      );

      if (response.structure) {
        adoptDraftStructurePagePatchCache(
          queryClient,
          websiteId,
          response.structure,
          {
            ...response.page,
            metaRevision: response.revisions.metaRevision,
          },
          DEFAULT_CONTENT_STATE,
        );
      } else {
        patchDraftPageMetadataCache(
          queryClient,
          websiteId,
          {
            id: response.page.id,
            name: response.page.name,
            slug: response.page.slug,
            metaRevision: response.revisions.metaRevision,
          },
          DEFAULT_CONTENT_STATE,
        );
      }

      if (response.outcome === "updated") await Promise.all([
        invalidatePageMutationStatusViews({
          queryClient,
          websiteId,
          outcome: response.outcome,
        }),
        ...(response.slugChanged
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

      if (shouldRunNormalPageUpdateSuccess(result.completion)) {
        options.onSuccess?.(result);
      }
    },
    onSettled: () => setUpdatingPageId(null),
    retry: false,
  });

  const adoptMetadataConflictCurrent = useCallback(
    (details: PageMetadataConflictDetails): void => {
      adoptPageMetadataConflictCurrentCache(
        queryClient,
        websiteId,
        details,
        DEFAULT_CONTENT_STATE,
      );
    },
    [queryClient, websiteId],
  );

  const executeUpdate = useCallback(
    async (
      pageId: string,
      baseline: PageEditBaseline,
      next: PageFormValues,
      completion: UpdatePageArgs["completion"],
      dirtyFields?: PageFormDirtyFields,
    ): Promise<Readonly<{
      outcome: UpdatePageSubmissionOutcome;
      response?: UpdatePageResponse;
    }>> => {
      if (mutation.isPending) return { outcome: "ignored" };
      const pageIdKey = String(pageId ?? "").trim();
      if (!pageIdKey) {
        notify.error(
          t("uiErrors.errorGeneric"),
          t(ERROR_CODES.PAGE_ID_REQUIRED),
        );
        return { outcome: "ignored" };
      }
      if (updatingPageId === pageIdKey) return { outcome: "ignored" };

      const normalizedBaseline = normalizePageFormValues(baseline.values);
      const normalizedNext = normalizePageFormValues(next);
      const parentChanged =
        normalizedBaseline.parentId !== normalizedNext.parentId;
      const payload = toUpdatePageIntentDTOFromFormValues({
        baseline: normalizedBaseline,
        local: normalizedNext,
        expectedMetaRevision: baseline.metaRevision,
        ...(parentChanged
          ? {
              expectedDraftStructureRevision:
                requireDraftStructureSnapshot(
                  queryClient,
                  websiteId,
                ).draftStructureRevision,
            }
          : {}),
        ...(dirtyFields ? { dirtyFields } : {}),
      });
      const fields = [
        ...Object.keys(payload.metadataChanges?.changes ?? {}),
        ...(payload.parentChange ? ["parentId"] : []),
      ];

      if (fields.length === 0) {
        notifyNoChanges(
          t("notifications.noChanges.title"),
          t("notifications.noChanges.description", { entity: entityLabel }),
        );
        return { outcome: "noChanges" };
      }

      setUpdatingPageId(pageIdKey);
      let response: UpdatePageResponse | undefined;
      const outcome = await submitPageUpdateMutation({
        mutate: async () => {
          const result = await mutation.mutateAsync({
            pageId: pageIdKey,
            payload,
            fields,
            completion,
          });
          response = result.response;
          return result;
        },
        onMetadataConflict,
        onStructureConflict: (details, error) => {
          const current = adoptDraftStructureConflictDetails(
            queryClient,
            websiteId,
            details,
          );
          notify.fromError(error, UiError.unexpectedSave);
          onStructureConflict?.({
            ...details,
            currentDraftStructureRevision:
              current.draftStructureRevision,
            current,
          });
        },
        onUnexpectedError: (error) => {
          notify.fromError(error, UiError.unexpectedSave);
          logger.error("update.failed", {
            websiteId,
            msg: String(error),
          });
        },
      });
      return { outcome, ...(response ? { response } : {}) };
    },
    [
      entityLabel,
      mutation,
      onMetadataConflict,
      onStructureConflict,
      queryClient,
      t,
      updatingPageId,
      websiteId,
    ],
  );

  const update = useCallback(
    async (
      pageId: string,
      baseline: PageEditBaseline,
      next: PageFormValues,
      dirtyFields?: PageFormDirtyFields,
    ): Promise<UpdatePageSubmissionOutcome> => (
      await executeUpdate(pageId, baseline, next, "normal", dirtyFields)
    ).outcome,
    [executeUpdate],
  );

  const resolveMetadataConflict = useCallback(async (
    pageId: string,
    baseline: PageEditBaseline,
    next: PageFormValues,
  ): Promise<PageMetadataOnlyUpdateResult> => {
    const structuralParentId = baseline.values.parentId;
    const result = await executeUpdate(
      pageId,
      baseline,
      { ...next, parentId: structuralParentId },
      "metadata-only",
    );
    if (result.outcome === "submitted" && result.response) {
      return { status: "submitted", response: result.response };
    }
    if (result.outcome === "metadataConflict") {
      return { status: "metadataConflict" };
    }
    if (result.outcome === "noChanges") return { status: "noChanges" };
    return { status: "ignored" };
  }, [executeUpdate]);

  return useMemo(
    () => ({
      update,
      resolveMetadataConflict,
      adoptMetadataConflictCurrent,
      updatingPageId,
      isUpdating: mutation.isPending,
    }),
    [
      adoptMetadataConflictCurrent,
      mutation.isPending,
      resolveMetadataConflict,
      update,
      updatingPageId,
    ],
  );
}

useUpdatePage.displayName = "useUpdatePage";
