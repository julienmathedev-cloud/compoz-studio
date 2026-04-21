"use client";

/**
 * @file apps/studio/src/features/pages/hooks/useDeletePage.ts
 * @layer hooks/studio/pages
 *
 * @description
 * Hook studio React Query pour supprimer une page draft via l’API.
 *
 * @remarks
 * - Tenant-scoped cache : toutes les query keys incluent `tenantId`.
 * - Pousse immédiatement le nouvel index dans le cache après suppression.
 * - Purge les caches `pageById` et `pageBlocks` pour éviter une UI fantôme.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { pagesStudioApi } from "@compoz/infra/http/studio/pages.client";
import { log } from "@compoz/infra/lib/log";
import { useTenantId } from "@compoz/studio/features/admin/tenant/TenantContext";
import { removePageBlocksCache } from "@compoz/studio/features/pages/blocks/cache/cache";
import { pageByIdKey } from "@compoz/studio/features/pages/cache/keys";
import { setSiteIndexCache } from "@compoz/studio/features/site-index/cache";
import {
  invalidatePageStatusViews,
  invalidateSiteStatus,
} from "@compoz/studio/features/site/status/invalidate";
import { notify } from "@compoz/studio/lib/ui/notify";
import { notifyDeleted } from "@compoz/studio/lib/ui/notify-presets";
import { UiError } from "@compoz/studio/lib/ui/uiError";
import { withSaveLogs } from "@compoz/ui/hooks/instrumentation";

type DeletePageArgs = Readonly<{
  pageId: string;
  label?: string;
}>;

type UseDeletePageResult = Readonly<{
  deletingPageId: string | null;
  isDeleting: boolean;
  remove: (args: DeletePageArgs) => Promise<void>;
}>;

const lg = log.child({ ns: "hook", name: "useDeletePage" });

/**
 * Hook de suppression d’une page (tenant-scoped).
 */
export function useDeletePage(onSuccess?: () => void): UseDeletePageResult {
  const t = useTranslations();
  const qc = useQueryClient();
  const tenantId = useTenantId();
  const entityLabel = t("studio.shared.entities.page");

  const [deletingPageId, setDeletingPageId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationKey: ["t", tenantId, "studio", "pages", "delete"] as const,

    mutationFn: async (args: DeletePageArgs) => {
      const pageId = String(args.pageId ?? "").trim();
      const fields = ["pageId"] as const;

      const response = await withSaveLogs(
        "useDeletePage",
        DEFAULT_CONTENT_STATE,
        () => pagesStudioApi.remove(pageId),
        { entity: entityLabel, fields, pageId, tenantId },
      );

      return {
        ...args,
        pageId,
        nextIndex: response.index,
      } as const;
    },

    onSuccess: async (args) => {
      notifyDeleted(
        t("notifications.deleted.title", { entity: entityLabel }),
        t("notifications.deleted.description", {
          entity: entityLabel,
          name: args.label ?? args.pageId,
        }),
      );

      if (args.nextIndex) {
        setSiteIndexCache(qc, tenantId, DEFAULT_CONTENT_STATE, args.nextIndex);
      }

      qc.removeQueries({
        queryKey: pageByIdKey(tenantId, args.pageId, DEFAULT_CONTENT_STATE),
        exact: true,
      });

      removePageBlocksCache(qc, tenantId, args.pageId, DEFAULT_CONTENT_STATE);

      await Promise.all([
        invalidateSiteStatus(qc, tenantId),
        invalidatePageStatusViews(qc, tenantId),
      ]);

      lg.debug("delete.ok", {
        tenantId,
        pageId: args.pageId,
        pagesInIndex: args.nextIndex?.pages?.length ?? undefined,
      });

      onSuccess?.();
    },

    onError: (error: unknown, args) => {
      notify.fromError(error, UiError.unexpectedSave);
      lg.error("delete.failed", {
        tenantId,
        pageId: args.pageId,
        msg: String(error),
      });
    },

    onSettled: () => {
      setDeletingPageId(null);
    },

    retry: false,
  });

  const remove = useCallback(
    async (args: DeletePageArgs) => {
      const pageId = String(args.pageId ?? "").trim();
      if (!pageId) return;
      if (deletingPageId === pageId) return;

      setDeletingPageId(pageId);
      await mutation.mutateAsync({ ...args, pageId });
    },
    [deletingPageId, mutation],
  );

  return {
    remove,
    deletingPageId,
    isDeleting: mutation.isPending,
  } as const;
}

useDeletePage.displayName = "useDeletePage";
