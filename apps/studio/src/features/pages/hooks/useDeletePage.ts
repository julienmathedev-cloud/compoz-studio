"use client";

/**
 * @file apps/studio/src/features/pages/hooks/useDeletePage.ts
 * @layer studio/features/pages/hooks
 *
 * @description
 * React Query mutation hook for deleting a draft page through the pages Studio API.
 *
 * @remarks
 * - Uses save instrumentation with draft content state for logs and notifications.
 * - Tracks the targeted deletion through `deletingPageId` so only the matching page is blocked.
 * - Updates the SiteIndex cache immediately from the returned payload after deletion.
 * - Removes page-by-id and page-block caches to avoid stale deleted-page UI.
 * - Invalidates site and page status views after deletion.
 * - Studio cache keys are scoped by Prisma Website.id.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { pagesStudioApi } from "@compoz/infra/http/studio/pages.client";
import { log } from "@compoz/infra/lib/log";
import { useWebsiteId } from "@compoz/studio/features/admin/website/WebsiteContext";
import { removePageBlocksCache } from "@compoz/studio/features/pages/blocks/cache/cache";
import { pageByIdKey } from "@compoz/studio/features/pages/cache/keys";
import {
  adoptDraftStructureConflict,
  draftStructureMutationOptions,
  requireDraftStructureSnapshot,
} from "@compoz/studio/features/pages/hooks/draft-structure-mutation";
import { setDraftStructureCache } from "@compoz/studio/features/site-index/cache";
import { siteIndexKey } from "@compoz/studio/features/site-index/keys";
import { invalidateAllSiteStatusViews } from "@compoz/studio/features/site/status/invalidate";
import { notify } from "@compoz/studio/lib/ui/notify";
import { notifyDeleted } from "@compoz/studio/lib/ui/notify-presets";
import { UiError } from "@compoz/studio/lib/ui/uiError";
import { withSaveLogs } from "@compoz/ui/hooks/instrumentation";

type DeletePageArgs = Readonly<{
  pageId: string;
  label?: string;
}>;

type UseDeletePageResult = Readonly<{
  deletingPageId: string | null;
  isDeleting: boolean;
  remove: (args: DeletePageArgs) => Promise<void>;
}>;

const logger = log.child({ ns: "hook", name: "useDeletePage" });

export function useDeletePage(onSuccess?: () => void): UseDeletePageResult {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const websiteId = useWebsiteId();

  const entityLabel = t("studio.shared.entities.page");

  const [deletingPageId, setDeletingPageId] = useState<string | null>(null);

  const mutation = useMutation({
    ...draftStructureMutationOptions(websiteId),

    mutationFn: async (args: DeletePageArgs) => {
      const pageId = String(args.pageId ?? "").trim();
      const fields = ["pageId"] as const;
      await queryClient.cancelQueries({
        queryKey: siteIndexKey(
          websiteId,
          DEFAULT_CONTENT_STATE,
        ),
        exact: true,
      });
      const snapshot = requireDraftStructureSnapshot(queryClient, websiteId);

      const response = await withSaveLogs(
        "useDeletePage",
        DEFAULT_CONTENT_STATE,
        () =>
          pagesStudioApi.remove(pageId, {
            expectedDraftStructureRevision:
              snapshot.draftStructureRevision,
          }),
        {
          entity: entityLabel,
          fields,
          pageId,
          websiteId,
        },
      );

      return {
        ...args,
        pageId,
        nextSnapshot: response,
      } as const;
    },

    onSuccess: async (args) => {
      notifyDeleted(
        t("notifications.deleted.title", { entity: entityLabel }),
        t("notifications.deleted.description", {
          entity: entityLabel,
          name: args.label ?? args.pageId,
        }),
      );

      setDraftStructureCache(
        queryClient,
        websiteId,
        DEFAULT_CONTENT_STATE,
        args.nextSnapshot,
      );

      queryClient.removeQueries({
        queryKey: pageByIdKey(websiteId, args.pageId, DEFAULT_CONTENT_STATE),
        exact: true,
      });

      removePageBlocksCache(
        queryClient,
        websiteId,
        args.pageId,
        DEFAULT_CONTENT_STATE,
      );

      await invalidateAllSiteStatusViews(queryClient, websiteId);

      logger.debug("delete.ok", {
        websiteId,
        pageId: args.pageId,
        pagesInIndex: args.nextSnapshot.index.pages.length,
      });

      onSuccess?.();
    },

    onError: (error: unknown, args) => {
      adoptDraftStructureConflict(queryClient, websiteId, error);
      notify.fromError(error, UiError.unexpectedSave);

      logger.error("delete.failed", {
        websiteId,
        pageId: args.pageId,
        msg: String(error),
      });
    },

    onSettled: () => {
      setDeletingPageId(null);
    },

    retry: false,
  });

  const remove = useCallback(
    async (args: DeletePageArgs) => {
      const pageId = String(args.pageId ?? "").trim();

      if (!pageId) return;
      if (deletingPageId === pageId) return;

      setDeletingPageId(pageId);

      await mutation.mutateAsync({
        ...args,
        pageId,
      });
    },
    [deletingPageId, mutation],
  );

  return {
    remove,
    deletingPageId,
    isDeleting: mutation.isPending,
  };
}

useDeletePage.displayName = "useDeletePage";
