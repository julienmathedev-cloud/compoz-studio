"use client";

/**
 * @file apps/studio/src/features/pages/blocks/hooks/useUpdateBlock.ts
 * @layer studio/features/pages/blocks/hooks
 *
 * @description
 * React Query mutation hook for updating a draft section block through the pages Studio API.
 *
 * @remarks
 * - Builds a minimal API patch from the shallow diff between baseline and next UI values.
 * - Handles no-change cases before calling the API.
 * - Tracks the targeted update through `updatingBlockId` so only the matching block is blocked.
 * - Synchronizes page and block-list caches from the returned page payload.
 * - Invalidates site and block status views after update.
 * - Studio cache keys are scoped by Prisma Website.id.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { pagesStudioApi } from "@compoz/infra/http/studio/pages.client";
import { log } from "@compoz/infra/lib/log";
import { useWebsiteId } from "@compoz/studio/features/admin/website/WebsiteContext";
import { syncBlocksFromPageCache } from "@compoz/studio/features/pages/blocks/cache/cache-sync";
import { toUpdateSectionBlockIntentDTOFromFormValues } from "@compoz/studio/features/pages/mappers/blocks-form";
import {
  invalidateBlockStatusViews,
  invalidateSiteStatus,
} from "@compoz/studio/features/site/status/invalidate";
import { notify } from "@compoz/studio/lib/ui/notify";
import {
  notifyNoChanges,
  notifyUpdated,
} from "@compoz/studio/lib/ui/notify-presets";
import { UiError } from "@compoz/studio/lib/ui/uiError";
import { withSaveLogs } from "@compoz/ui/hooks/instrumentation";
import { buildShallowDiff } from "@compoz/ui/lib/build-shallow-diff";

import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import type { UpdateSectionBlockIntentDTO } from "@compoz/validation/pages/blocks/block-intents";

type UseUpdateBlockResult = Readonly<{
  update: (
    pageId: string,
    blockId: string,
    baseline: SectionBlockFormValues,
    next: SectionBlockFormValues,
    hasOtherLcpPriority?: boolean,
  ) => Promise<void>;
  updatingBlockId: string | null;
  isUpdating: boolean;
}>;

type UpdateBlockArgs = Readonly<{
  pageId: string;
  blockId: string;
  payload: UpdateSectionBlockIntentDTO;
  fields: ReadonlyArray<string>;
}>;

const logger = log.child({ ns: "hook", name: "useUpdateBlock" });

export function useUpdateBlock(onSuccess?: () => void): UseUpdateBlockResult {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const websiteId = useWebsiteId();

  const entityLabel = t("studio.shared.entities.blocks");

  const [lcpWasActivated, setLcpWasActivated] = useState(false);
  const [updatingBlockId, setUpdatingBlockId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationKey: [
      "w",
      websiteId,
      "studio",
      "pages",
      "blocks",
      "update",
    ] as const,

    mutationFn: async (args: UpdateBlockArgs & { signal?: AbortSignal }) => {
      const { pageId, blockId, payload, fields, signal } = args;

      const response = await withSaveLogs(
        "useUpdateBlock",
        DEFAULT_CONTENT_STATE,
        () => pagesStudioApi.updateBlock(pageId, blockId, payload, { signal }),
        {
          entity: entityLabel,
          fields,
          pageId,
          blockId,
          websiteId,
        },
      );

      return {
        pageId,
        blockId,
        fields,
        page: response.page,
      } as const;
    },

    onSuccess: async ({ fields, pageId, page, blockId }) => {
      notifyUpdated(
        t("notifications.updated.title", { entity: entityLabel }),
        t("notifications.updated.description", { fields: fields.join(", ") }),
      );

      if (lcpWasActivated) {
        notify.info(t("studio.pageBlockEditHeader.lcpPriority.replacedInfo"));
      }

      setLcpWasActivated(false);

      const pageIdKey = String(pageId ?? "").trim();

      if (pageIdKey && page) {
        syncBlocksFromPageCache(
          queryClient,
          websiteId,
          pageIdKey,
          page,
          DEFAULT_CONTENT_STATE,
        );
      }

      await Promise.all([
        invalidateSiteStatus(queryClient, websiteId),
        invalidateBlockStatusViews(queryClient, websiteId, pageIdKey),
      ]);

      logger.debug("update.ok", {
        websiteId,
        pageId: pageIdKey,
        blockId,
        fields,
      });

      onSuccess?.();
    },

    onError: (error: unknown) => {
      notify.fromError(error, UiError.unexpectedSave);

      logger.error("update.failed", {
        websiteId,
        msg: String(error),
      });
    },

    onSettled: () => {
      setUpdatingBlockId(null);
    },

    retry: false,
  });

  const update = useCallback(
    async (
      pageId: string,
      blockId: string,
      baseline: SectionBlockFormValues,
      next: SectionBlockFormValues,
      hasOtherLcpPriority?: boolean,
    ) => {
      if (mutation.isPending) return;

      const pageIdKey = String(pageId ?? "").trim();
      const blockIdKey = String(blockId ?? "").trim();

      if (!pageIdKey || !blockIdKey) return;
      if (updatingBlockId === blockIdKey) return;

      const uiPatch =
        buildShallowDiff<SectionBlockFormValues>(baseline, next) ?? null;

      if (!uiPatch) {
        notifyNoChanges(
          t("notifications.noChanges.title"),
          t("notifications.noChanges.description", { entity: entityLabel }),
        );

        return;
      }

      const lcpWasJustActivated =
        uiPatch.lcpPriority === true && baseline.lcpPriority !== true;

      setLcpWasActivated(Boolean(lcpWasJustActivated && hasOtherLcpPriority));

      const payload: UpdateSectionBlockIntentDTO =
        toUpdateSectionBlockIntentDTOFromFormValues({
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
    },
    [entityLabel, mutation, t, updatingBlockId],
  );

  return useMemo(
    () => ({
      update,
      updatingBlockId,
      isUpdating: mutation.isPending,
    }),
    [update, updatingBlockId, mutation.isPending],
  );
}

useUpdateBlock.displayName = "useUpdateBlock";
