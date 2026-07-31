"use client";

/**
 * @file apps/studio/src/features/pages/blocks/hooks/useCreateBlock.ts
 * @layer studio/features/pages/blocks/hooks
 * @description Page-scoped pessimistic block creation using the current revisioned snapshot.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { PageBlocksSnapshotDTO } from "@compoz/core/domain/pages/dto";
import type { PageBlocksConflictDetails } from "@compoz/core/domain/pages/revisions/page-blocks.types";
import { pagesStudioApi } from "@compoz/infra/http/studio/pages.client";
import type { AddSectionBlockResponse } from "@compoz/infra/http/studio/pages.types";
import { getPageBlocksConflictDetails } from "@compoz/infra/lib/get-page-blocks-conflict-details";
import { useWebsiteId } from "@compoz/studio/features/admin/website/WebsiteContext";
import { syncPageBlocksSnapshotCache } from "@compoz/studio/features/pages/blocks/cache/cache-sync";
import { pageBlocksKey } from "@compoz/studio/features/pages/blocks/cache/keys";
import { pageBlocksMutationScope } from "@compoz/studio/features/pages/blocks/hooks/page-blocks-mutation-scope";
import { invalidateBlockMutationStatusViews } from "@compoz/studio/features/pages/blocks/hooks/invalidate-block-mutation-status-views";
import { toCreateSectionBlockIntentDTOFromFormValues } from "@compoz/studio/features/pages/mappers/blocks-form";
import { notify } from "@compoz/studio/lib/ui/notify";
import { notifyCreated } from "@compoz/studio/lib/ui/notify-presets";
import { UiError } from "@compoz/studio/lib/ui/uiError";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import { useState } from "react";

type CreateBlockArgs = Readonly<{
  values: SectionBlockFormValues;
  label?: string;
}>;

export function useCreateBlock(pageId: string, onSuccess?: () => void) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const websiteId = useWebsiteId();
  const pageIdKey = String(pageId ?? "").trim();
  const entityLabel = t("studio.shared.entities.blocks");
  const [conflict, setConflict] =
    useState<PageBlocksConflictDetails | null>(null);

  const mutation = useMutation({
    mutationKey: ["w", websiteId, "studio", "pages", pageIdKey, "blocks", "create"] as const,
    scope: { id: pageBlocksMutationScope(websiteId, pageIdKey) },
    mutationFn: async (args: CreateBlockArgs): Promise<AddSectionBlockResponse> => {
      const snapshot = queryClient.getQueryData<PageBlocksSnapshotDTO>(
        pageBlocksKey(websiteId, pageIdKey, DEFAULT_CONTENT_STATE),
      );
      if (!snapshot) throw new Error("PAGE_BLOCKS_SNAPSHOT_REQUIRED");

      return pagesStudioApi.addBlock(
        pageIdKey,
        toCreateSectionBlockIntentDTOFromFormValues({
          values: args.values,
          expectedBlocksRevision: snapshot.blocksRevision,
          baselineOrder: snapshot.blocks.map((block) => block.id),
          baselineLcpPriorityBlockId:
            snapshot.blocks.find((block) => block.lcpPriority)?.id ?? null,
        }),
      );
    },
    onMutate: () => setConflict(null),
    onSuccess: async (response, variables) => {
      syncPageBlocksSnapshotCache(
        queryClient,
        websiteId,
        pageIdKey,
        response,
      );
      notifyCreated(
        t("notifications.created.title", { entity: entityLabel }),
        t("notifications.created.description", {
          entity: entityLabel,
          name: variables.label ?? response.createdBlockId,
        }),
      );
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
    retry: false,
  });

  return {
    create: (args: CreateBlockArgs) => mutation.mutateAsync(args),
    isCreating: mutation.isPending,
    conflict,
    clearConflict: () => setConflict(null),
  };
}

useCreateBlock.displayName = "useCreateBlock";
