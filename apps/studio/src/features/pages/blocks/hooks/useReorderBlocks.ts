"use client";

/**
 * @file apps/studio/src/features/pages/blocks/hooks/useReorderBlocks.ts
 * @layer hooks/studio/pages/blocks
 *
 * @description
 * Hook studio React Query pour réordonner les blocks d’une page draft via l’API.
 *
 * @remarks
 * - Optimistic update pour drag-and-drop fluide.
 * - Rollback automatique si erreur API.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { BlockDTO } from "@compoz/core/domain/pages/dto";
import { pagesStudioApi } from "@compoz/infra/http/studio/pages.client";
import { log } from "@compoz/infra/lib/log";

import { useTenantId } from "@compoz/studio/features/admin/tenant/TenantContext";

import { pageBlocksKey } from "@compoz/studio/features/pages/blocks/cache/keys";

import { patchPageBlocksCache } from "@compoz/studio/features/pages/blocks/cache/cache";

import { syncBlocksFromPageCache } from "@compoz/studio/features/pages/blocks/cache/cache-sync";

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

const lg = log.child({ ns: "hook", name: "useReorderBlocks" });

export function useReorderBlocks(
  onSuccess?: () => void,
): UseReorderBlocksResult {
  const t = useTranslations();
  const qc = useQueryClient();
  const tenantId = useTenantId();
  const entityLabel = t("studio.shared.entities.blocks");

  const mutation = useMutation({
    mutationKey: [
      "t",
      tenantId,
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
      const key = pageBlocksKey(tenantId, pageIdKey, DEFAULT_CONTENT_STATE);

      await qc.cancelQueries({ queryKey: key });

      const previous = qc.getQueryData<ReadonlyArray<BlockDTO>>(key);

      if (previous) {
        const ordered = values.orderedBlockIds;

        patchPageBlocksCache(
          qc,
          tenantId,
          pageIdKey,
          DEFAULT_CONTENT_STATE,
          (prev) => {
            const map = new Map(prev.map((b) => [b.id, b]));

            return ordered
              .map((id) => map.get(id))
              .filter(Boolean) as ReadonlyArray<BlockDTO>;
          },
        );

        console.log(
          "RQ BLOCK CACHE AFTER OPTIMISTIC",
          qc
            .getQueryData<ReadonlyArray<BlockDTO>>(key)
            ?.map((block) => block.id),
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
          tenantId,
        },
      );
      console.log(
        "REORDER RESPONSE BLOCK IDS",
        response.page.blocks?.map((block) => block.id),
      );
      console.log("REORDER PAYLOAD IDS", payload.orderedBlockIds);
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
          qc,
          tenantId,
          pageId,
          page,
          DEFAULT_CONTENT_STATE,
        );

        console.log(
          "RQ BLOCK CACHE AFTER SYNC",
          qc
            .getQueryData<
              ReadonlyArray<BlockDTO>
            >(pageBlocksKey(tenantId, pageId, DEFAULT_CONTENT_STATE))
            ?.map((block) => block.id),
        );
      }

      await Promise.all([
        invalidateSiteStatus(qc, tenantId),
        invalidateBlockStatusViews(qc, tenantId, pageId),
      ]);

      lg.info("reorder.ok", {
        tenantId,
        pageId,
        count: payload.orderedBlockIds.length,
      });

      onSuccess?.();
    },

    /* ------------------------------------------------------------------ */
    /* Rollback                                                            */
    /* ------------------------------------------------------------------ */

    onError: (error: unknown, _vars, context) => {
      notify.fromError(error, UiError.unexpectedSave);

      if (context?.previous && context?.pageIdKey) {
        qc.setQueryData(
          pageBlocksKey(tenantId, context.pageIdKey, DEFAULT_CONTENT_STATE),
          context.previous,
        );
      }

      lg.error("reorder.failed", { tenantId, msg: String(error) });
    },

    retry: false,
  });

  return {
    reorder: async (pageId, values) => {
      await mutation.mutateAsync({ pageId, values });
    },
    isReordering: mutation.isPending,
  } as const;
}

useReorderBlocks.displayName = "useReorderBlocks";
