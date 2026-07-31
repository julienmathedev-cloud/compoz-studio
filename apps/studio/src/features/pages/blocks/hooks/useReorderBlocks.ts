"use client";

/**
 * @file apps/studio/src/features/pages/blocks/hooks/useReorderBlocks.ts
 * @layer studio/features/pages/blocks/hooks
 * @description Page-scoped optimistic reorder with revision-aware guarded rollback.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { PageBlocksSnapshotDTO } from "@compoz/core/domain/pages/dto";
import type { PageBlocksConflictDetails } from "@compoz/core/domain/pages/revisions/page-blocks.types";
import { pagesStudioApi } from "@compoz/infra/http/studio/pages.client";
import { getPageBlocksConflictDetails } from "@compoz/infra/lib/get-page-blocks-conflict-details";
import { useWebsiteId } from "@compoz/studio/features/admin/website/WebsiteContext";
import { useState } from "react";
import { syncPageBlocksSnapshotCache } from "@compoz/studio/features/pages/blocks/cache/cache-sync";
import {
  canRollbackOptimisticReorder,
  optimisticReorderSnapshot,
} from "@compoz/studio/features/pages/blocks/cache/reorder-optimistic";
import { pageBlocksKey } from "@compoz/studio/features/pages/blocks/cache/keys";
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
  const [conflict, setConflict] =
    useState<PageBlocksConflictDetails | null>(null);
  const key = pageBlocksKey(websiteId, pageIdKey, DEFAULT_CONTENT_STATE);

  const mutation = useMutation({
    mutationKey: ["w", websiteId, "studio", "pages", pageIdKey, "blocks", "reorder"] as const,
    scope: { id: pageBlocksMutationScope(websiteId, pageIdKey) },
    onMutate: async (intent: ReorderArgs) => {
      setConflict(null);
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
      const details = getPageBlocksConflictDetails(error);
      if (details) {
        syncPageBlocksSnapshotCache(
          queryClient,
          websiteId,
          pageIdKey,
          details.current,
          DEFAULT_CONTENT_STATE,
          true,
        );
        setConflict(details);
        return;
      }
      notify.fromError(error, UiError.unexpectedSave);
    },
    retry: false,
  });

  return {
    reorder: (intent: ReorderArgs) => mutation.mutateAsync(intent),
    isReordering: mutation.isPending,
    entityLabel,
    conflict,
    clearConflict: () => setConflict(null),
  };
}

useReorderBlocks.displayName = "useReorderBlocks";
