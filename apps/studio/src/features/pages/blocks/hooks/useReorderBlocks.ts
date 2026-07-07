"use client";

/**
 * @file apps/studio/src/features/pages/blocks/hooks/useReorderBlocks.ts
 * @layer studio/features/pages/blocks/hooks
 *
 * @description
 * React Query mutation hook for reordering draft page blocks through the pages Studio API.
 *
 * @remarks
 * - Applies an optimistic block-list reorder for smooth drag-and-drop feedback.
 * - Rolls back to the previous block order when the API call fails.
 * - Synchronizes page and block-list caches from the returned page payload after success.
 * - Invalidates site and block status views after reordering.
 * - Studio cache keys are scoped by Prisma Website.id and content state.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { BlockDTO } from "@compoz/core/domain/pages/dto";
import { pagesStudioApi } from "@compoz/infra/http/studio/pages.client";
import { log } from "@compoz/infra/lib/log";

import { useWebsiteId } from "@compoz/studio/features/admin/website/WebsiteContext";
import { patchPageBlocksCache } from "@compoz/studio/features/pages/blocks/cache/cache";
import { syncBlocksFromPageCache } from "@compoz/studio/features/pages/blocks/cache/cache-sync";
import { pageBlocksKey } from "@compoz/studio/features/pages/blocks/cache/keys";
import { normalizeReorderBlocksIntentDTO } from "@compoz/studio/features/pages/mappers/blocks-form";
import {
  invalidateBlockStatusViews,
  invalidateSiteStatus,
} from "@compoz/studio/features/site/status/invalidate";
import { notify } from "@compoz/studio/lib/ui/notify";
import { UiError } from "@compoz/studio/lib/ui/uiError";

import { withSaveLogs } from "@compoz/ui/hooks/instrumentation";

import type { ReorderBlocksIntentDTO } from "@compoz/validation/pages/blocks/block-intents";

type UseReorderBlocksResult = Readonly<{
  reorder: (pageId: string, values: ReorderBlocksIntentDTO) => Promise<void>;
  isReordering: boolean;
}>;

type ReorderBlocksArgs = Readonly<{
  pageId: string;
  values: ReorderBlocksIntentDTO;
}>;

const logger = log.child({ ns: "hook", name: "useReorderBlocks" });

export function useReorderBlocks(
  onSuccess?: () => void,
): UseReorderBlocksResult {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const websiteId = useWebsiteId();

  const entityLabel = t("studio.shared.entities.blocks");

  const mutation = useMutation({
    mutationKey: [
      "w",
      websiteId,
      "studio",
      "pages",
      "blocks",
      "reorder",
    ] as const,

    // Optimistic block-list reorder.

    onMutate: async ({ pageId, values }: ReorderBlocksArgs) => {
      const pageIdKey = String(pageId ?? "").trim();

      const key = pageBlocksKey(websiteId, pageIdKey, DEFAULT_CONTENT_STATE);

      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<ReadonlyArray<BlockDTO>>(key);

      if (previous) {
        const orderedBlockIds = values.orderedBlockIds;

        patchPageBlocksCache(
          queryClient,
          websiteId,
          pageIdKey,
          DEFAULT_CONTENT_STATE,
          (previousBlocks) => {
            const blockById = new Map(
              previousBlocks.map((block) => [block.id, block]),
            );

            return orderedBlockIds
              .map((blockId) => blockById.get(blockId))
              .filter(Boolean) as ReadonlyArray<BlockDTO>;
          },
        );
      }

      return { previous, pageIdKey };
    },

    mutationFn: async ({ pageId, values }: ReorderBlocksArgs) => {
      const pageIdKey = String(pageId ?? "").trim();

      const payload = normalizeReorderBlocksIntentDTO({
        orderedBlockIds: values.orderedBlockIds,
      });

      const response = await withSaveLogs(
        "useReorderBlocks",
        DEFAULT_CONTENT_STATE,
        () => pagesStudioApi.reorderBlocks(pageIdKey, payload),
        {
          entity: entityLabel,
          pageId: pageIdKey,
          websiteId,
        },
      );

      return {
        pageId: pageIdKey,
        payload,
        page: response.page,
      } as const;
    },

    onSuccess: async ({ pageId, payload, page }) => {
      if (pageId && page) {
        syncBlocksFromPageCache(
          queryClient,
          websiteId,
          pageId,
          page,
          DEFAULT_CONTENT_STATE,
        );
      }

      await Promise.all([
        invalidateSiteStatus(queryClient, websiteId),
        invalidateBlockStatusViews(queryClient, websiteId, pageId),
      ]);

      logger.debug("reorder.ok", {
        websiteId,
        pageId,
        count: payload.orderedBlockIds.length,
      });

      onSuccess?.();
    },

    // Roll back the optimistic order on API failure.

    onError: (error: unknown, _variables, context) => {
      notify.fromError(error, UiError.unexpectedSave);

      if (context?.previous && context?.pageIdKey) {
        queryClient.setQueryData(
          pageBlocksKey(websiteId, context.pageIdKey, DEFAULT_CONTENT_STATE),
          context.previous,
        );
      }

      logger.error("reorder.failed", {
        websiteId,
        msg: String(error),
      });
    },

    retry: false,
  });

  return {
    reorder: async (pageId, values) => {
      await mutation.mutateAsync({ pageId, values });
    },
    isReordering: mutation.isPending,
  };
}

useReorderBlocks.displayName = "useReorderBlocks";
