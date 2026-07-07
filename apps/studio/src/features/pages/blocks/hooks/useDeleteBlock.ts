"use client";

/**
 * @file apps/studio/src/features/pages/blocks/hooks/useDeleteBlock.ts
 * @layer studio/features/pages/blocks/hooks
 *
 * @description
 * React Query mutation hook for deleting a draft block through the pages Studio API.
 *
 * @remarks
 * - Uses save instrumentation with draft content state for logs and notifications.
 * - Tracks the targeted deletion through `deletingBlockId` so only the matching block is blocked.
 * - Synchronizes page and block-list caches from the returned page payload.
 * - Invalidates site and block status views after deletion.
 * - Studio cache keys are scoped by Prisma Website.id.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { pagesStudioApi } from "@compoz/infra/http/studio/pages.client";
import type { DeleteBlockResponse } from "@compoz/infra/http/studio/pages.types";
import { log } from "@compoz/infra/lib/log";
import { useWebsiteId } from "@compoz/studio/features/admin/website/WebsiteContext";
import { syncBlocksFromPageCache } from "@compoz/studio/features/pages/blocks/cache/cache-sync";
import {
  invalidateBlockStatusViews,
  invalidateSiteStatus,
} from "@compoz/studio/features/site/status/invalidate";
import { notify } from "@compoz/studio/lib/ui/notify";
import { notifyDeleted } from "@compoz/studio/lib/ui/notify-presets";
import { UiError } from "@compoz/studio/lib/ui/uiError";
import { withSaveLogs } from "@compoz/ui/hooks/instrumentation";

type DeleteBlockArgs = Readonly<{
  pageId: string;
  blockId: string;
}>;

type UseDeleteBlockResult = Readonly<{
  deletingBlockId: string | null;
  isDeleting: boolean;
  remove: (pageId: string, blockId: string) => Promise<void>;
}>;

const logger = log.child({ ns: "hook", name: "useDeleteBlock" });

export function useDeleteBlock(onSuccess?: () => void): UseDeleteBlockResult {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const websiteId = useWebsiteId();

  const entityLabel = t("studio.shared.entities.blocks");

  const [deletingBlockId, setDeletingBlockId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationKey: [
      "w",
      websiteId,
      "studio",
      "pages",
      "blocks",
      "delete",
    ] as const,

    mutationFn: async ({ pageId, blockId }: DeleteBlockArgs) => {
      const pageIdKey = String(pageId ?? "").trim();
      const blockIdKey = String(blockId ?? "").trim();

      const response: DeleteBlockResponse = await withSaveLogs(
        "useDeleteBlock",
        DEFAULT_CONTENT_STATE,
        () => pagesStudioApi.deleteBlock(pageIdKey, blockIdKey),
        {
          entity: entityLabel,
          pageId: pageIdKey,
          blockId: blockIdKey,
          websiteId,
        },
      );

      return {
        pageId: pageIdKey,
        blockId: blockIdKey,
        page: response.page,
      } as const;
    },

    onSuccess: async ({ pageId, blockId, page }) => {
      notifyDeleted(
        t("notifications.deleted.title", { entity: entityLabel }),
        t("notifications.deleted.description", {
          entity: entityLabel,
          name: blockId,
        }),
      );

      const pageIdKey = String(pageId ?? "").trim();

      if (pageIdKey && page) {
        syncBlocksFromPageCache(
          queryClient,
          websiteId,
          pageIdKey,
          page,
          DEFAULT_CONTENT_STATE,
        );
      }

      await Promise.all([
        invalidateSiteStatus(queryClient, websiteId),
        invalidateBlockStatusViews(queryClient, websiteId, pageIdKey),
      ]);

      logger.debug("delete.ok", {
        websiteId,
        pageId,
        blockId,
      });

      onSuccess?.();
    },

    onError: (error: unknown, variables) => {
      notify.fromError(error, UiError.unexpectedSave);

      logger.error("delete.failed", {
        websiteId,
        pageId: variables.pageId,
        blockId: variables.blockId,
        msg: String(error),
      });
    },

    onSettled: (_data, _error, variables) => {
      const blockIdKey = String(variables?.blockId ?? "").trim();

      if (!blockIdKey) return;

      setDeletingBlockId((current) =>
        current === blockIdKey ? null : current,
      );

      logger.debug("delete.done", {
        websiteId,
        pageId: variables?.pageId,
        blockId: blockIdKey,
      });
    },

    retry: false,
  });

  const remove = useCallback(
    async (pageId: string, blockId: string) => {
      const pageIdKey = String(pageId ?? "").trim();
      const blockIdKey = String(blockId ?? "").trim();

      if (!pageIdKey || !blockIdKey) return;
      if (deletingBlockId === blockIdKey) return;

      setDeletingBlockId(blockIdKey);

      await mutation.mutateAsync({
        pageId: pageIdKey,
        blockId: blockIdKey,
      });
    },
    [deletingBlockId, mutation],
  );

  return {
    remove,
    deletingBlockId,
    isDeleting: mutation.isPending,
  };
}

useDeleteBlock.displayName = "useDeleteBlock";
