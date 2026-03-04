"use client";

/**
 * @file apps/studio/src/features/pages/hooks/useDeletePage.ts
 * @layer hooks/admin/pages
 *
 * @remarks
 * - Tenant-scoped cache: toutes les query keys doivent inclure tenantId,
 *   pour éviter les collisions lors d’un switch tenant.
 */

import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { pagesAdminApi } from "@compoz/infra/http/studio/pages.client";
import { log } from "@compoz/infra/lib/log";
import { withSaveLogs } from "@compoz/ui/hooks/instrumentation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import { useTenantId } from "@compoz/studio/features/admin/context/TenantContext";
import { pageByIdKey } from "@compoz/studio/features/pages/cache/keys";
import { setSiteIndexCache } from "@compoz/studio/features/site-index/cache";
import {
  invalidateSiteStatus,
  invalidateSiteStatusDetails,
} from "@compoz/studio/features/site/status/invalidate";
import { notify } from "@compoz/studio/lib/ui/notify";
import { notifyDeleted } from "@compoz/studio/lib/ui/notify-presets";
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

/**
 * Hook delete page (tenant-scoped).
 *
 * @param tenantId - tenant courant (SoT : cookie tenant actif résolu côté server, puis passé au client)
 */
export function useDeletePage(onSuccess?: () => void): UseDeletePageResult {
  const t = useTranslations();
  const qc = useQueryClient();
  const entityLabel = t("admin.shared.entities.page");
  const tenantId = useTenantId();

  const [deletingPageId, setDeletingPageId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationKey: ["t", tenantId, "admin", "pages", "delete"] as const,

    mutationFn: async (args: DeletePageArgs) => {
      const pageId = String(args.pageId ?? "").trim();
      const fields = ["pageId"] as const;

      const res = await withSaveLogs(
        "useDeletePage",
        WRITE_CONTENT_STATE,
        () => pagesAdminApi.remove(pageId),
        { entity: entityLabel, fields, pageId, tenantId },
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
      // ⚠️ Si setSiteIndexCache devient tenant-scoped, adapte sa signature pareil.
      if (args.nextIndex) {
        setSiteIndexCache(qc, tenantId, WRITE_CONTENT_STATE, args.nextIndex);
      }

      // ✅ 2) purge cache page-by-id (évite une UI “fantôme”)
      qc.removeQueries({
        queryKey: pageByIdKey(tenantId, args.pageId, WRITE_CONTENT_STATE),
        exact: true,
      });

      // ✅ 3) nettoyage blocks (draft) + snapshot status (kv)
      // ⚠️ invalidateDraftBlocksList doit aussi devenir tenant-scoped => invalidateDraftBlocksList(qc, tId, pageId)
      await Promise.all([
        //invalidateDraftBlocksList(qc, tenantId, args.pageId),
        invalidateSiteStatus(qc, tenantId),
        invalidateSiteStatusDetails(qc, tenantId),
      ]);

      lg.info("delete.ok", {
        tenantId: tenantId,
        pageId: args.pageId,
        pagesInIndex: args.nextIndex?.pages?.length ?? undefined,
      });

      onSuccess?.();
    },

    onError: (e: unknown, args) => {
      notify.fromError(e, UiError.unexpectedSave);
      lg.error("delete.failed", {
        tenantId: tenantId,
        pageId: args.pageId,
        msg: String(e),
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
    [mutation, deletingPageId],
  );

  return {
    remove,
    deletingPageId,
    isDeleting: mutation.isPending,
  } as const;
}

useDeletePage.displayName = "useDeletePage";
