"use client";

/**
 * @file apps/studio/src/features/pages/hooks/useDeletePage.ts
 * @layer hooks/admin/pages
 */

import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { log } from "@compoz/infra/lib/log";
import { withSaveLogs } from "@compoz/ui/hooks/instrumentation";
import { notify } from "@compoz/studio/lib/ui/notify";
import { notifyDeleted } from "@compoz/studio/lib/ui/notify-presets";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import { pagesAdminApi } from "@compoz/infra/http/studio/pages.client";
import { invalidateDraftBlocksList } from "@compoz/studio/features/pages/blocks/cache/invalidate";
import { pageByIdKey } from "@compoz/studio/features/pages/cache/keys";
import { setSiteIndexCache } from "@compoz/studio/features/site-index/cache";
import { invalidateSiteStatusDetails } from "@compoz/studio/features/site/status/invalidate";
import { UiError } from "@compoz/studio/lib/ui/uiError";

type UseDeletePageResult = Readonly<{
  deletingPageId: string | null;
  isDeleting: boolean;
  remove: (args: DeletePageArgs) => Promise<void>;
}>;

type DeletePageArgs = Readonly<{
  pageId: string;
  label?: string;
}>;

const lg = log.child({ ns: "hook", name: "useDeletePage" });

export function useDeletePage(onSuccess?: () => void): UseDeletePageResult {
  const t = useTranslations();
  const qc = useQueryClient();
  const entityLabel = t("admin.shared.entities.page");

  const [deletingPageId, setDeletingPageId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationKey: ["admin", "pages", "delete"] as const,

    mutationFn: async (args: DeletePageArgs) => {
      const pageId = String(args.pageId ?? "").trim();
      const fields = ["pageId"] as const;

      const res = await withSaveLogs(
        "useDeletePage",
        WRITE_CONTENT_STATE,
        () => pagesAdminApi.remove(pageId),
        { entity: entityLabel, fields, pageId },
      );

      // ✅ flatten route response (DeletePageResponse = { index: SiteIndexDTO })
      const nextIndex = res.index;

      return { ...args, pageId, nextIndex } as const;
    },

    onSuccess: async (args) => {
      notifyDeleted(
        t("notifications.deleted.title", { entity: entityLabel }),
        t("notifications.deleted.description", {
          entity: entityLabel,
          name: args.label ?? args.pageId,
        }),
      );

      // ✅ 1) push immédiat siteIndex (plus d’invalidate/read)
      if (args.nextIndex) {
        setSiteIndexCache(qc, WRITE_CONTENT_STATE, args.nextIndex);
      }

      // ✅ 2) purge cache page-by-id (évite une UI “fantôme”)
      qc.removeQueries({
        queryKey: pageByIdKey(args.pageId, WRITE_CONTENT_STATE),
        exact: true,
      });

      // ✅ 3) nettoyage blocks (draft) + snapshot status (kv)
      await Promise.all([
        invalidateDraftBlocksList(qc, args.pageId),
        invalidateSiteStatusDetails(qc),
      ]);

      lg.info("delete.ok", {
        pageId: args.pageId,
        pagesInIndex: args.nextIndex?.pages?.length ?? undefined,
      });

      onSuccess?.();
    },

    onError: (e: unknown, args) => {
      notify.fromError(e, UiError.unexpectedSave);
      lg.error("delete.failed", { pageId: args.pageId, msg: String(e) });
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
    [mutation, deletingPageId],
  );

  return {
    remove,
    deletingPageId,
    isDeleting: mutation.isPending,
  } as const;
}

useDeletePage.displayName = "useDeletePage";
