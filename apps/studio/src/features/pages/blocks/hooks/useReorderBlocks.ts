"use client";

/**
 * @file apps/studio/src/features/pages/blocks/hooks/useReorderBlocks.ts
 * @layer hooks/studio/pages/blocks
 *
 * @description
 * Hook Studio React Query pour réordonner les blocks d’une page draft via l’API.
 *
 * @remarks
 * - Optimistic update pour drag-and-drop fluide.
 * - Rollback automatique si erreur API.
 * - Le cache et les queryKeys sont scopés par Prisma Website.id.
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

    /* ------------------------------------------------------------------ */
    /* Optimistic update                                                   */
    /* ------------------------------------------------------------------ */

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

    /* ------------------------------------------------------------------ */
    /* API call                                                            */
    /* ------------------------------------------------------------------ */

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

    /* ------------------------------------------------------------------ */
    /* Success                                                             */
    /* ------------------------------------------------------------------ */

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

    /* ------------------------------------------------------------------ */
    /* Rollback                                                            */
    /* ------------------------------------------------------------------ */

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
