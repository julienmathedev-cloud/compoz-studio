"use client";

/**
 * @file apps/studio/src/features/pages/blocks/hooks/useUpdateBlock.ts
 * @layer hooks/admin/pages/blocks
 *
 * @description
 * Hook admin React Query pour mettre à jour un block LayoutSection (draft) via l’API.
 *
 * @remarks
 * - Orchestration UI-only (mutation, logs, notifications).
 * - Applique un PATCH minimal à partir d’un baseline + next (UI).
 * - Gère explicitement le cas “no changes”.
 * - Aucune logique métier ni validation domaine.
 */

import { notify } from "@compoz/studio/lib/ui/notify";
import {
  notifyNoChanges,
  notifyUpdated,
} from "@compoz/studio/lib/ui/notify-presets";
import { withSaveLogs } from "@compoz/ui/hooks/instrumentation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { pagesAdminApi } from "@compoz/infra/http/studio/pages.client";
import { log } from "@compoz/infra/lib/log";
import { useTenantId } from "@compoz/studio/features/admin/context/TenantContext";
import { syncBlocksFromPageCache } from "@compoz/studio/features/pages/blocks/cache/cache-sync";
import { toUpdateLayoutSectionBlockIntentDTOFromFormValues } from "@compoz/studio/features/pages/mappers/blocks-form";
import {
  invalidateSiteStatus,
  invalidateSiteStatusDetails,
} from "@compoz/studio/features/site/status/invalidate";
import { UiError } from "@compoz/studio/lib/ui/uiError";
import { buildShallowDiff } from "@compoz/ui/lib/build-shallow-diff";
import type { LayoutSectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import type { UpdateLayoutSectionBlockIntentDTO } from "@compoz/validation/pages/blocks/block-intents";

type UseUpdateBlockResult = Readonly<{
  update: (
    pageId: string,
    blockId: string,
    baseline: LayoutSectionBlockFormValues,
    next: LayoutSectionBlockFormValues,
    hasOtherLcpPriority?: boolean,
  ) => Promise<void>;
  updatingBlockId: string | null;
  isUpdating: boolean;
}>;

const lg = log.child({ ns: "hook", name: "useUpdateBlock" });

type UpdateBlockArgs = Readonly<{
  pageId: string;
  blockId: string;
  payload: UpdateLayoutSectionBlockIntentDTO;
  fields: ReadonlyArray<string>;
}>;

export function useUpdateBlock(onSuccess?: () => void): UseUpdateBlockResult {
  const t = useTranslations();
  const qc = useQueryClient();
  const entityLabel = t("admin.shared.entities.blocks");
  const tenantId = useTenantId();

  const [lcpWasActivated, setLcpWasActivated] = useState(false);

  const [updatingBlockId, setUpdatingBlockId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationKey: ["t", tenantId, "admin", "pages", "blocks", "update"] as const,

    mutationFn: async (args: UpdateBlockArgs & { signal?: AbortSignal }) => {
      const { pageId, blockId, payload, fields, signal } = args;

      const res = await withSaveLogs(
        "useUpdateBlock",
        WRITE_CONTENT_STATE,
        () => pagesAdminApi.updateBlock(pageId, blockId, payload, { signal }),
        { entity: entityLabel, fields, pageId, blockId },
      );

      // ✅ flatten route response
      const page = res.page;

      return { pageId, blockId, fields, page } as const;
    },

    onSuccess: async ({ fields, pageId, page }) => {
      notifyUpdated(
        t("notifications.updated.title", { entity: entityLabel }),
        t("notifications.updated.description", { fields: fields.join(", ") }),
      );

      if (lcpWasActivated) {
        notify.info(t("admin.pageBlockEditHeader.lcpPriority.replacedInfo"));
      }
      setLcpWasActivated(false);

      const pageIdKey = (pageId ?? "").trim();

      if (pageIdKey && page) {
        syncBlocksFromPageCache(
          qc,
          tenantId,
          pageIdKey,
          page,
          WRITE_CONTENT_STATE,
        );
      }

      await Promise.all([
        invalidateSiteStatus(qc, tenantId),
        invalidateSiteStatusDetails(qc, tenantId),
      ]);

      onSuccess?.();
    },

    onError: (e: unknown) => {
      notify.fromError(e, UiError.unexpectedSave);
      lg.error("update.failed", { msg: String(e) });
    },

    onSettled: () => {
      setUpdatingBlockId(null);
    },
  });

  const update = useCallback(
    async (
      pageId: string,
      blockId: string,
      baseline: LayoutSectionBlockFormValues,
      next: LayoutSectionBlockFormValues,
      hasOtherLcpPriority?: boolean,
    ) => {
      if (mutation.isPending) return;

      const pageIdKey = (pageId ?? "").trim();
      const blockIdKey = (blockId ?? "").trim();
      if (!pageIdKey || !blockIdKey) return;

      if (updatingBlockId === blockIdKey) return;

      const uiPatch =
        buildShallowDiff<LayoutSectionBlockFormValues>(baseline, next) ?? null;

      if (!uiPatch) {
        notifyNoChanges(
          t("notifications.noChanges.title"),
          t("notifications.noChanges.description", { entity: entityLabel }),
        );
        return;
      }

      const lcpWasJustActivated =
        uiPatch?.lcpPriority === true && baseline.lcpPriority !== true;

      // ✅ ne toaste "replaced" QUE si on sait qu'il existait un autre bloc prioritaire
      setLcpWasActivated(Boolean(lcpWasJustActivated && hasOtherLcpPriority));

      const payload: UpdateLayoutSectionBlockIntentDTO =
        toUpdateLayoutSectionBlockIntentDTOFromFormValues({
          blockId: blockIdKey,
          patch: uiPatch,
        });

      const fields = Object.keys(payload.patch);

      if (fields.length === 0) {
        notifyNoChanges(
          t("notifications.noChanges.title"),
          t("notifications.noChanges.description", { entity: entityLabel }),
        );
        return;
      }

      setUpdatingBlockId(blockIdKey);

      await mutation.mutateAsync({
        pageId: pageIdKey,
        blockId: blockIdKey,
        payload,
        fields,
      });

      lg.info("update.ok", { pageId: pageIdKey, blockId: blockIdKey, fields });
    },
    [mutation, updatingBlockId, t, entityLabel],
  );

  return useMemo(
    () =>
      ({
        update,
        updatingBlockId,
        isUpdating: mutation.isPending,
      }) as const,
    [update, updatingBlockId, mutation.isPending],
  );
}
