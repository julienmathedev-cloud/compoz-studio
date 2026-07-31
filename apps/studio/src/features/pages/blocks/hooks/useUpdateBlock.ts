"use client";

/**
 * @file apps/studio/src/features/pages/blocks/hooks/useUpdateBlock.ts
 * @layer studio/features/pages/blocks/hooks
 * @description Page-scoped pessimistic section update returning the authoritative server snapshot.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { BlockDTO } from "@compoz/core/domain/pages/dto";
import type { PageBlocksConflictDetails } from "@compoz/core/domain/pages/revisions/page-blocks.types";
import { pagesStudioApi } from "@compoz/infra/http/studio/pages.client";
import type { UpdateSectionBlockResponse } from "@compoz/infra/http/studio/pages.types";
import { getPageBlocksConflictDetails } from "@compoz/infra/lib/get-page-blocks-conflict-details";
import { useWebsiteId } from "@compoz/studio/features/admin/website/WebsiteContext";
import { syncPageBlocksSnapshotCache } from "@compoz/studio/features/pages/blocks/cache/cache-sync";
import { pageBlocksMutationScope } from "@compoz/studio/features/pages/blocks/hooks/page-blocks-mutation-scope";
import { invalidateBlockMutationStatusViews } from "@compoz/studio/features/pages/blocks/hooks/invalidate-block-mutation-status-views";
import { toUpdateSectionBlockIntentDTOFromFormValues } from "@compoz/studio/features/pages/mappers/blocks-form";
import { notify } from "@compoz/studio/lib/ui/notify";
import { notifyNoChanges, notifyUpdated } from "@compoz/studio/lib/ui/notify-presets";
import { UiError } from "@compoz/studio/lib/ui/uiError";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";

type UpdateArgs = Readonly<{
  blockId: string;
  baselineBlock: BlockDTO;
  local: SectionBlockFormValues;
  expectedBlocksRevision: number;
  baselineLcpPriorityBlockId: string | null;
}>;

export function useUpdateBlock(pageId: string, onSuccess?: (response: UpdateSectionBlockResponse) => void) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const websiteId = useWebsiteId();
  const pageIdKey = String(pageId ?? "").trim();
  const entityLabel = t("studio.shared.entities.blocks");
  const [updatingBlockId, setUpdatingBlockId] = useState<string | null>(null);
  const [conflict, setConflict] =
    useState<PageBlocksConflictDetails | null>(null);

  const mutation = useMutation({
    mutationKey: ["w", websiteId, "studio", "pages", pageIdKey, "blocks", "update"] as const,
    scope: { id: pageBlocksMutationScope(websiteId, pageIdKey) },
    mutationFn: async (args: UpdateArgs) => {
      const payload = toUpdateSectionBlockIntentDTOFromFormValues({
        baselineBlock: args.baselineBlock,
        local: args.local,
        expectedBlocksRevision: args.expectedBlocksRevision,
        baselineLcpPriorityBlockId: args.baselineLcpPriorityBlockId,
      });
      return pagesStudioApi.updateBlock(pageIdKey, args.blockId, payload);
    },
    onMutate: (args) => {
      setConflict(null);
      setUpdatingBlockId(args.blockId);
    },
    onSuccess: async (response) => {
      syncPageBlocksSnapshotCache(queryClient, websiteId, pageIdKey, response);
      if (response.outcome === "noChanges") {
        notifyNoChanges(
          t("notifications.noChanges.title"),
          t("notifications.noChanges.description", { entity: entityLabel }),
        );
      } else {
        notifyUpdated(
          t("notifications.updated.title", { entity: entityLabel }),
          t("notifications.updated.description", { fields: "" }),
        );
      }
      await invalidateBlockMutationStatusViews({ queryClient, websiteId, pageId: pageIdKey, outcome: response.outcome });
      onSuccess?.(response);
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
    onSettled: () => setUpdatingBlockId(null),
    retry: false,
  });

  return {
    update: (args: UpdateArgs) => mutation.mutateAsync(args),
    updatingBlockId,
    isUpdating: mutation.isPending,
    conflict,
    clearConflict: () => setConflict(null),
  };
}

useUpdateBlock.displayName = "useUpdateBlock";
