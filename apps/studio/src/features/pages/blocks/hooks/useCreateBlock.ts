"use client";

/**
 * @file apps/studio/src/features/pages/blocks/hooks/useCreateBlock.ts
 * @layer hooks/admin/pages/blocks
 *
 * @description
 * Hook admin React Query pour ajouter un block (draft) à une page via l’API.
 *
 * @remarks
 * - Orchestration UI-only (mutation, logs, notifications).
 * - Le formulaire fournit des FormValues UI.
 * - Aucune logique métier ni validation domaine.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { pagesAdminApi } from "@compoz/infra/http/studio/pages.client";
import { log } from "@compoz/infra/lib/log";
import { useTenantId } from "@compoz/studio/features/admin/context/TenantContext";
import { syncBlocksFromPageCache } from "@compoz/studio/features/pages/blocks/cache/cache-sync";
import { toCreateLayoutSectionBlockIntentDTOFromFormValues } from "@compoz/studio/features/pages/mappers/blocks-form";
import {
  invalidateSiteStatus,
  invalidateSiteStatusDetails,
} from "@compoz/studio/features/site/status/invalidate";
import { notify } from "@compoz/studio/lib/ui/notify";
import { notifyCreated } from "@compoz/studio/lib/ui/notify-presets";
import { UiError } from "@compoz/studio/lib/ui/uiError";
import { withSaveLogs } from "@compoz/ui/hooks/instrumentation";
import type { LayoutSectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";

type CreateBlockArgs = Readonly<{
  pageId: string;
  values: LayoutSectionBlockFormValues;
  insertAt?: number;
  label?: string;
}>;

type UseCreateBlockResult = Readonly<{
  create: (args: CreateBlockArgs) => Promise<void>;
  isCreating: boolean;
}>;

const lg = log.child({ ns: "hook", name: "useCreateBlock" });

export function useCreateBlock(onSuccess?: () => void): UseCreateBlockResult {
  const t = useTranslations();
  const qc = useQueryClient();
  const entityLabel = t("admin.shared.entities.blocks");
  const tenantId = useTenantId();

  const mutation = useMutation({
    mutationKey: ["t", tenantId, "admin", "pages", "blocks", "create"] as const,

    mutationFn: async (args: CreateBlockArgs) => {
      const pageId = (args.pageId ?? "").trim();

      const payload = toCreateLayoutSectionBlockIntentDTOFromFormValues({
        values: args.values,
        insertAt: args.insertAt,
      });

      const fields = Object.keys(payload ?? {});

      const res = await withSaveLogs(
        "useCreateBlock",
        WRITE_CONTENT_STATE,
        () => pagesAdminApi.addBlock(pageId, payload),
        { entity: entityLabel, fields, pageId },
      );

      // ✅ flatten (selon ta route : { page } ou { block } etc.)
      // Ici j’assume que la route renvoie { page: PageDTO } (pattern similaire à reorderBlocks)
      const page = res.page;

      return { pageId, fields, page } as const;
    },

    onSuccess: async ({ pageId, fields, page }, variables) => {
      const pid = (pageId ?? "").trim();

      const label =
        variables?.label ??
        (page?.id ? `#${page.id}` : String(variables?.insertAt ?? ""));

      notifyCreated(
        t("notifications.created.title", { entity: entityLabel }),
        t("notifications.created.description", {
          entity: entityLabel,
          name: label,
        }),
      );

      // ✅ 1) push cache (page + blocks)
      // if (pid) await invalidateBlocksBadgesForPage(qc, tenantId, pid);
      if (pid && page)
        syncBlocksFromPageCache(qc, tenantId, pid, page, WRITE_CONTENT_STATE);

      await Promise.all([
        invalidateSiteStatus(qc, tenantId),
        invalidateSiteStatusDetails(qc, tenantId),
      ]);

      lg.info("create.ok", {
        pageId,
        fields,
        // Si tu veux tracer un peu plus :
        returnedPageId: page?.id,
        returnedPageSlug: page?.slug,
      });

      onSuccess?.();
    },

    onError: (e: unknown) => {
      notify.fromError(e, UiError.unexpectedSave);
      lg.error("create.failed", { msg: String(e) });
    },
  });

  return {
    create: async (args) => {
      await mutation.mutateAsync(args);
    },
    isCreating: mutation.isPending,
  } as const;
}
