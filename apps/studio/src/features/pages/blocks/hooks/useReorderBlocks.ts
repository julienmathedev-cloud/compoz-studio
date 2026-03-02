"use client";

/**
 * @file apps/studio/src/features/pages/blocks/hooks/useReorderBlocks.ts
 * @layer hooks/admin/pages/blocks
 */

import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { log } from "@compoz/infra/lib/log";
import { withSaveLogs } from "@compoz/ui/hooks/instrumentation";
import type { ReorderBlocksIntentDTO } from "@compoz/validation/pages/blocks/block-intents";
import { notify } from "@compoz/studio/lib/ui/notify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { pagesAdminApi } from "@compoz/infra/http/studio/pages.client";
import { syncBlocksFromPageCache } from "@compoz/studio/features/pages/blocks/cache/cache-sync";
import { normalizedReorderBlocksIntentDTO } from "@compoz/studio/features/pages/mappers/blocks-form";
import { invalidateBlocksBadgesForPage } from "@compoz/studio/features/site/status/invalidate";
import { UiError } from "@compoz/studio/lib/ui/uiError";

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
  const entityLabel = t("admin.shared.entities.blocks");

  const mutation = useMutation({
    mutationKey: ["admin", "pages", "blocks", "reorder"] as const,

    mutationFn: async (args: ReorderBlocksArgs) => {
      const pageId = (args.pageId ?? "").trim();

      const payload = normalizedReorderBlocksIntentDTO({
        orderedBlockIds: args.values.orderedBlockIds,
      });

      const fields = Object.keys(payload ?? {});

      const res = await withSaveLogs(
        "useReorderBlocks",
        WRITE_CONTENT_STATE,
        () => pagesAdminApi.reorderBlocks(pageId, payload),
        { entity: entityLabel, fields, pageId },
      );

      // ✅ flatten route response (prêt pour cache update si besoin)
      const page = res.page;

      return { pageId, payload, fields, page } as const;
    },

    onSuccess: async ({ pageId, payload, page }) => {
      const pid = (pageId ?? "").trim();

      if (pid && page) {
        syncBlocksFromPageCache(qc, pid, page, WRITE_CONTENT_STATE);
      }

      if (pid) {
        await invalidateBlocksBadgesForPage(qc, pid);
      }

      lg.info("reorder.ok", { pageId, count: payload.orderedBlockIds.length });
      onSuccess?.();
    },

    onError: (e: unknown) => {
      notify.fromError(e, UiError.unexpectedSave);
      lg.error("reorder.failed", { msg: String(e) });
    },
  });

  return {
    reorder: async (pageId, values) => {
      await mutation.mutateAsync({ pageId, values });
    },
    isReordering: mutation.isPending,
  } as const;
}
