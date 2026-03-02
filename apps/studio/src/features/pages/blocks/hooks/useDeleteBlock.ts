"use client";

/**
 * @file apps/studio/src/features/pages/blocks/hooks/useDeleteBlock.ts
 * @layer hooks/admin/pages/blocks
 *
 * @description
 * Hook admin React Query pour supprimer un block (draft) via l’API.
 *
 * @remarks
 * - Orchestration UI-only (mutation, logs, notifications).
 * - Gère l’état de suppression ciblé via `deletingBlockId`.
 * - Option B : ne bloque que si c’est le même blockId.
 * - Aucune logique métier ni validation domaine.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import { withSaveLogs } from "@compoz/ui/hooks/instrumentation";
import { notify } from "@compoz/studio/lib/ui/notify";
import { notifyDeleted } from "@compoz/studio/lib/ui/notify-presets";

import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { pagesAdminApi } from "@compoz/infra/http/studio/pages.client";
import type { DeleteBlockResponse } from "@compoz/infra/http/studio/pages.types";
import { log } from "@compoz/infra/lib/log";
import { syncBlocksFromPageCache } from "@compoz/studio/features/pages/blocks/cache/cache-sync";
import { invalidateBlocksBadgesForPage } from "@compoz/studio/features/site/status/invalidate";
import { UiError } from "@compoz/studio/lib/ui/uiError";

type UseDeleteBlockResult = Readonly<{
  deletingBlockId: string | null;
  isDeleting: boolean;
  remove: (pageId: string, blockId: string) => Promise<void>;
}>;

const lg = log.child({ ns: "hook", name: "useDeleteBlock" });

type DeleteBlockArgs = Readonly<{ pageId: string; blockId: string }>;

export function useDeleteBlock(onSuccess?: () => void): UseDeleteBlockResult {
  const t = useTranslations();
  const qc = useQueryClient();
  const entityLabel = t("admin.shared.entities.blocks");

  const [deletingBlockId, setDeletingBlockId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationKey: ["admin", "pages", "blocks", "delete"] as const,

    mutationFn: async ({ pageId, blockId }: DeleteBlockArgs) => {
      const res: DeleteBlockResponse = await withSaveLogs(
        "useDeleteBlock",
        WRITE_CONTENT_STATE,
        () => pagesAdminApi.deleteBlock(pageId, blockId),
        { entity: entityLabel, pageId, blockId },
      );
      const { page } = res;
      // (si la route renvoie { page } ou { index } tu pourrais flattener ici)
      return { pageId, blockId, page } as const;
    },

    onSuccess: async ({ pageId, blockId, page }) => {
      notifyDeleted(
        t("notifications.deleted.title", { entity: entityLabel }),
        t("notifications.deleted.description", {
          entity: entityLabel,
          name: blockId,
        }),
      );

      const pid = (pageId ?? "").trim();

      if (pid && page) {
        syncBlocksFromPageCache(qc, pid, page, WRITE_CONTENT_STATE);
      }

      if (pid) {
        await invalidateBlocksBadgesForPage(qc, pid);
      }

      lg.info("delete.ok", { pageId, blockId });
      onSuccess?.();
    },

    onError: (e: unknown, vars) => {
      notify.fromError(e, UiError.unexpectedSave);
      lg.error("delete.failed", {
        pageId: vars.pageId,
        blockId: vars.blockId,
        msg: String(e),
      });
    },

    onSettled: (_data, _err, vars) => {
      const bid = (vars?.blockId ?? "").trim();
      if (!bid) return;

      setDeletingBlockId((cur) => (cur === bid ? null : cur));
      lg.debug("delete.done", { pageId: vars?.pageId, blockId: bid });
    },
  });

  const remove = useCallback(
    async (pageId: string, blockId: string) => {
      const pageIdKey = (pageId ?? "").trim();
      const blockIdKey = (blockId ?? "").trim();
      if (!pageIdKey || !blockIdKey) return;

      if (deletingBlockId === blockIdKey) return;

      setDeletingBlockId(blockIdKey);
      await mutation.mutateAsync({ pageId: pageIdKey, blockId: blockIdKey });
    },
    [mutation, deletingBlockId],
  );

  return {
    remove,
    deletingBlockId,
    isDeleting: mutation.isPending,
  } as const;
}
