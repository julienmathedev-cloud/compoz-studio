"use client";

/**
 * @file apps/studio/src/features/pages/blocks/hooks/useReorderBlocks.ts
 * @layer hooks/studio/pages/blocks
 *
 * @description
 * Hook studio React Query pour réordonner les blocks d’une page draft via l’API.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { pagesStudioApi } from "@compoz/infra/http/studio/pages.client";
import { log } from "@compoz/infra/lib/log";
import { useTenantId } from "@compoz/studio/features/admin/tenant/TenantContext";
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

    mutationFn: async (args: ReorderBlocksArgs) => {
      const pageId = String(args.pageId ?? "").trim();

      const payload = normalizeReorderBlocksIntentDTO({
        orderedBlockIds: args.values.orderedBlockIds,
      });

      const fields = Object.keys(payload ?? {});

      const response = await withSaveLogs(
        "useReorderBlocks",
        DEFAULT_CONTENT_STATE,
        () => pagesStudioApi.reorderBlocks(pageId, payload),
        { entity: entityLabel, fields, pageId, tenantId },
      );

      return {
        pageId,
        payload,
        fields,
        page: response.page,
      } as const;
    },

    onSuccess: async ({ pageId, payload, page }) => {
      const pageIdKey = String(pageId ?? "").trim();

      if (pageIdKey && page) {
        syncBlocksFromPageCache(
          qc,
          tenantId,
          pageIdKey,
          page,
          DEFAULT_CONTENT_STATE,
        );
      }

      await Promise.all([
        invalidateSiteStatus(qc, tenantId),
        invalidateBlockStatusViews(qc, tenantId, pageIdKey),
      ]);

      lg.info("reorder.ok", {
        tenantId,
        pageId,
        count: payload.orderedBlockIds.length,
      });

      onSuccess?.();
    },

    onError: (error: unknown) => {
      notify.fromError(error, UiError.unexpectedSave);
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
