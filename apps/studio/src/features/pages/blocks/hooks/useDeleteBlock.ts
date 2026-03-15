"use client";

/**
 * @file apps/studio/src/features/pages/blocks/hooks/useDeleteBlock.ts
 * @layer hooks/studio/pages/blocks
 *
 * @description
 * Hook studio React Query pour supprimer un block draft via l’API.
 *
 * @remarks
 * - Orchestration UI-only (mutation, logs, notifications).
 * - Gère l’état de suppression ciblé via `deletingBlockId`.
 * - Option B : ne bloque que si c’est le même `blockId`.
 * - Aucune logique métier ni validation domaine.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { pagesStudioApi } from "@compoz/infra/http/studio/pages.client";
import type { DeleteBlockResponse } from "@compoz/infra/http/studio/pages.types";
import { log } from "@compoz/infra/lib/log";
import { useTenantId } from "@compoz/studio/features/admin/tenant/TenantContext";
import { syncBlocksFromPageCache } from "@compoz/studio/features/pages/blocks/cache/cache-sync";
import {
  invalidateBlockStatusViews,
  invalidateSiteStatus,
} from "@compoz/studio/features/site/status/invalidate";
import { notify } from "@compoz/studio/lib/ui/notify";
import { notifyDeleted } from "@compoz/studio/lib/ui/notify-presets";
import { UiError } from "@compoz/studio/lib/ui/uiError";
import { withSaveLogs } from "@compoz/ui/hooks/instrumentation";

type DeleteBlockArgs = Readonly<{
  pageId: string;
  blockId: string;
}>;

type UseDeleteBlockResult = Readonly<{
  deletingBlockId: string | null;
  isDeleting: boolean;
  remove: (pageId: string, blockId: string) => Promise<void>;
}>;

const lg = log.child({ ns: "hook", name: "useDeleteBlock" });

export function useDeleteBlock(onSuccess?: () => void): UseDeleteBlockResult {
  const t = useTranslations();
  const qc = useQueryClient();
  const tenantId = useTenantId();
  const entityLabel = t("studio.shared.entities.blocks");

  const [deletingBlockId, setDeletingBlockId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationKey: [
      "t",
      tenantId,
      "studio",
      "pages",
      "blocks",
      "delete",
    ] as const,

    mutationFn: async ({ pageId, blockId }: DeleteBlockArgs) => {
      const pageIdKey = String(pageId ?? "").trim();
      const blockIdKey = String(blockId ?? "").trim();

      const response: DeleteBlockResponse = await withSaveLogs(
        "useDeleteBlock",
        DEFAULT_CONTENT_STATE,
        () => pagesStudioApi.deleteBlock(pageIdKey, blockIdKey),
        {
          entity: entityLabel,
          pageId: pageIdKey,
          blockId: blockIdKey,
          tenantId,
        },
      );

      return {
        pageId: pageIdKey,
        blockId: blockIdKey,
        page: response.page,
      } as const;
    },

    onSuccess: async ({ pageId, blockId, page }) => {
      notifyDeleted(
        t("notifications.deleted.title", { entity: entityLabel }),
        t("notifications.deleted.description", {
          entity: entityLabel,
          name: blockId,
        }),
      );

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

      lg.info("delete.ok", { tenantId, pageId, blockId });
      onSuccess?.();
    },

    onError: (error: unknown, variables) => {
      notify.fromError(error, UiError.unexpectedSave);
      lg.error("delete.failed", {
        tenantId,
        pageId: variables.pageId,
        blockId: variables.blockId,
        msg: String(error),
      });
    },

    onSettled: (_data, _error, variables) => {
      const blockIdKey = String(variables?.blockId ?? "").trim();
      if (!blockIdKey) return;

      setDeletingBlockId((current) =>
        current === blockIdKey ? null : current,
      );

      lg.debug("delete.done", {
        tenantId,
        pageId: variables?.pageId,
        blockId: blockIdKey,
      });
    },

    retry: false,
  });

  const remove = useCallback(
    async (pageId: string, blockId: string) => {
      const pageIdKey = String(pageId ?? "").trim();
      const blockIdKey = String(blockId ?? "").trim();

      if (!pageIdKey || !blockIdKey) return;
      if (deletingBlockId === blockIdKey) return;

      setDeletingBlockId(blockIdKey);
      await mutation.mutateAsync({ pageId: pageIdKey, blockId: blockIdKey });
    },
    [deletingBlockId, mutation],
  );

  return {
    remove,
    deletingBlockId,
    isDeleting: mutation.isPending,
  } as const;
}

useDeleteBlock.displayName = "useDeleteBlock";
