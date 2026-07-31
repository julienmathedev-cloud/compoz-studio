"use client";

/**
 * @file apps/studio/src/features/pages/blocks/hooks/useDeleteBlock.ts
 * @layer studio/features/pages/blocks/hooks
 * @description Page-scoped pessimistic semantic delete with an explicit baseline block.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { PageBlocksSnapshotDTO } from "@compoz/core/domain/pages/dto";
import type { PageBlocksConflictDetails } from "@compoz/core/domain/pages/revisions/page-blocks.types";
import { pagesStudioApi } from "@compoz/infra/http/studio/pages.client";
import { getPageBlocksConflictDetails } from "@compoz/infra/lib/get-page-blocks-conflict-details";
import { useWebsiteId } from "@compoz/studio/features/admin/website/WebsiteContext";
import { syncPageBlocksSnapshotCache } from "@compoz/studio/features/pages/blocks/cache/cache-sync";
import { pageBlocksKey } from "@compoz/studio/features/pages/blocks/cache/keys";
import { pageBlocksMutationScope } from "@compoz/studio/features/pages/blocks/hooks/page-blocks-mutation-scope";
import { invalidateBlockMutationStatusViews } from "@compoz/studio/features/pages/blocks/hooks/invalidate-block-mutation-status-views";
import { notify } from "@compoz/studio/lib/ui/notify";
import { notifyDeleted, notifyNoChanges } from "@compoz/studio/lib/ui/notify-presets";
import { UiError } from "@compoz/studio/lib/ui/uiError";

export function useDeleteBlock(pageId: string, onSuccess?: () => void) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const websiteId = useWebsiteId();
  const pageIdKey = String(pageId ?? "").trim();
  const entityLabel = t("studio.shared.entities.blocks");
  const [deletingBlockId, setDeletingBlockId] = useState<string | null>(null);
  const [conflict, setConflict] =
    useState<PageBlocksConflictDetails | null>(null);

  const mutation = useMutation({
    mutationKey: ["w", websiteId, "studio", "pages", pageIdKey, "blocks", "delete"] as const,
    scope: { id: pageBlocksMutationScope(websiteId, pageIdKey) },
    mutationFn: async (blockId: string) => {
      const snapshot = queryClient.getQueryData<PageBlocksSnapshotDTO>(
        pageBlocksKey(websiteId, pageIdKey, DEFAULT_CONTENT_STATE),
      );
      const baselineBlock = snapshot?.blocks.find((block) => block.id === blockId);
      if (!snapshot || !baselineBlock) throw new Error("BLOCK_BASELINE_REQUIRED");
      return pagesStudioApi.deleteBlock(pageIdKey, blockId, {
        expectedBlocksRevision: snapshot.blocksRevision,
        baselineBlock,
      });
    },
    onMutate: (blockId) => {
      setConflict(null);
      setDeletingBlockId(blockId);
    },
    onSuccess: async (response, blockId) => {
      syncPageBlocksSnapshotCache(queryClient, websiteId, pageIdKey, response);
      if (response.outcome === "noChanges") {
        notifyNoChanges(
          t("notifications.noChanges.title"),
          t("notifications.noChanges.description", { entity: entityLabel }),
        );
      } else {
        notifyDeleted(
          t("notifications.deleted.title", { entity: entityLabel }),
          t("notifications.deleted.description", { entity: entityLabel, name: blockId }),
        );
      }
      await invalidateBlockMutationStatusViews({ queryClient, websiteId, pageId: pageIdKey, outcome: response.outcome });
      onSuccess?.();
    },
    onError: (error) => {
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
    onSettled: () => setDeletingBlockId(null),
    retry: false,
  });

  return {
    remove: (blockId: string) => mutation.mutateAsync(blockId),
    deletingBlockId,
    isDeleting: mutation.isPending,
    conflict,
    clearConflict: () => setConflict(null),
  };
}

useDeleteBlock.displayName = "useDeleteBlock";
