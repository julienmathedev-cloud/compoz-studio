"use client";

/**
 * @file apps/studio/src/features/pages/blocks/hooks/useReorderBlocks.ts
 * @layer studio/features/pages/blocks/hooks
 * @description Page-scoped optimistic reorder with revision-aware guarded rollback.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRef } from "react";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { PageBlocksSnapshotDTO } from "@compoz/core/domain/pages/dto";
import { pagesStudioApi } from "@compoz/infra/http/studio/pages.client";
import { useWebsiteId } from "@compoz/studio/features/admin/website/WebsiteContext";
import { syncPageBlocksSnapshotCache } from "@compoz/studio/features/pages/blocks/cache/cache-sync";
import {
  canRollbackOptimisticReorder,
  optimisticReorderSnapshot,
} from "@compoz/studio/features/pages/blocks/cache/reorder-optimistic";
import { pageBlocksKey } from "@compoz/studio/features/pages/blocks/cache/keys";
import { adoptPageBlocksReorderConflict } from "@compoz/studio/features/pages/blocks/hooks/block-reorder-conflict";
import { pageBlocksMutationScope } from "@compoz/studio/features/pages/blocks/hooks/page-blocks-mutation-scope";
import { invalidateBlockMutationStatusViews } from "@compoz/studio/features/pages/blocks/hooks/invalidate-block-mutation-status-views";
import { notify } from "@compoz/studio/lib/ui/notify";
import { UiError } from "@compoz/studio/lib/ui/uiError";

type ReorderArgs = Readonly<{
  baselineOrder: ReadonlyArray<string>;
  expectedBlocksRevision: number;
  localOrder: ReadonlyArray<string>;
}>;

export function useReorderBlocks(pageId: string, onSuccess?: () => void) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const websiteId = useWebsiteId();
  const pageIdKey = String(pageId ?? "").trim();
  const entityLabel = t("studio.shared.entities.blocks");
  const key = pageBlocksKey(websiteId, pageIdKey, DEFAULT_CONTENT_STATE);
  const pendingReorderRef = useRef<Promise<unknown> | null>(null);

  const mutation = useMutation({
    mutationKey: ["w", websiteId, "studio", "pages", pageIdKey, "blocks", "reorder"] as const,
    scope: { id: pageBlocksMutationScope(websiteId, pageIdKey) },
    onMutate: async (intent: ReorderArgs) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<PageBlocksSnapshotDTO>(key);
      if (!previous) return { previous: undefined, optimisticOrder: intent.localOrder };
      const optimistic = optimisticReorderSnapshot(previous, intent.localOrder);
      queryClient.setQueryData(key, optimistic);
      return {
        previous,
        optimisticOrder: optimistic.blocks.map((block) => block.id),
      };
    },
    mutationFn: (intent: ReorderArgs) =>
      pagesStudioApi.reorderBlocks(pageIdKey, {
        expectedBlocksRevision: intent.expectedBlocksRevision,
        baselineOrder: [...intent.baselineOrder],
        localOrder: [...intent.localOrder],
      }),
    onSuccess: async (response) => {
      syncPageBlocksSnapshotCache(queryClient, websiteId, pageIdKey, response);
      await invalidateBlockMutationStatusViews({ queryClient, websiteId, outcome: response.outcome });
      onSuccess?.();
    },
    onError: (error, _intent, context) => {
      const conflict = adoptPageBlocksReorderConflict({
        queryClient,
        websiteId,
        pageId: pageIdKey,
        error,
      });
      if (conflict) {
        notify.error(
          t("studio.pageBlocksConflict.reorderConflict.title"),
          t("studio.pageBlocksConflict.reorderConflict.description"),
        );
        return;
      }

      const current = queryClient.getQueryData<PageBlocksSnapshotDTO>(key);
      if (
        context?.previous &&
        canRollbackOptimisticReorder({
          current,
          previous: context.previous,
          optimisticOrder: context.optimisticOrder,
        })
      ) {
        queryClient.setQueryData(key, context.previous);
      }
      notify.fromError(error, UiError.unexpectedSave);
    },
    retry: false,
  });

  const reorder = async (intent: ReorderArgs): Promise<void> => {
    const running = pendingReorderRef.current;
    if (running) {
      await running;
      return;
    }

    const execution = mutation.mutateAsync(intent);
    pendingReorderRef.current = execution;
    try {
      await execution;
    } finally {
      if (pendingReorderRef.current === execution) {
        pendingReorderRef.current = null;
      }
    }
  };

  return {
    reorder,
    isReordering: mutation.isPending,
    entityLabel,
  };
}

useReorderBlocks.displayName = "useReorderBlocks";
