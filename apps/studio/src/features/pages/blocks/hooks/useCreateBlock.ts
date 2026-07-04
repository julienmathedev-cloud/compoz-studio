"use client";

/**
 * @file apps/studio/src/features/pages/blocks/hooks/useCreateBlock.ts
 * @layer hooks/studio/pages/blocks
 *
 * @description
 * Hook Studio React Query pour ajouter un block draft à une page via l’API.
 *
 * @remarks
 * - Orchestration UI-only : mutation, logs, notifications.
 * - Le formulaire fournit des FormValues UI.
 * - Aucune logique métier ni validation domaine.
 * - Le cache et les queryKeys sont scopés par Prisma Website.id.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { pagesStudioApi } from "@compoz/infra/http/studio/pages.client";
import { log } from "@compoz/infra/lib/log";

import { useWebsiteId } from "@compoz/studio/features/admin/website/WebsiteContext";
import { syncBlocksFromPageCache } from "@compoz/studio/features/pages/blocks/cache/cache-sync";
import { toCreateSectionBlockIntentDTOFromFormValues } from "@compoz/studio/features/pages/mappers/blocks-form";
import {
  invalidateBlockStatusViews,
  invalidateSiteStatus,
} from "@compoz/studio/features/site/status/invalidate";
import { notify } from "@compoz/studio/lib/ui/notify";
import { notifyCreated } from "@compoz/studio/lib/ui/notify-presets";
import { UiError } from "@compoz/studio/lib/ui/uiError";

import { withSaveLogs } from "@compoz/ui/hooks/instrumentation";

import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";

type CreateBlockArgs = Readonly<{
  pageId: string;
  values: SectionBlockFormValues;
  insertAt?: number;
  label?: string;
}>;

type UseCreateBlockResult = Readonly<{
  create: (args: CreateBlockArgs) => Promise<void>;
  isCreating: boolean;
}>;

const logger = log.child({ ns: "hook", name: "useCreateBlock" });

export function useCreateBlock(onSuccess?: () => void): UseCreateBlockResult {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const websiteId = useWebsiteId();

  const entityLabel = t("studio.shared.entities.blocks");

  const mutation = useMutation({
    mutationKey: [
      "w",
      websiteId,
      "studio",
      "pages",
      "blocks",
      "create",
    ] as const,

    mutationFn: async (args: CreateBlockArgs) => {
      const pageId = String(args.pageId ?? "").trim();

      const payload = toCreateSectionBlockIntentDTOFromFormValues({
        values: args.values,
        insertAt: args.insertAt,
      });

      const fields = Object.keys(payload ?? {});

      const response = await withSaveLogs(
        "useCreateBlock",
        DEFAULT_CONTENT_STATE,
        () => pagesStudioApi.addBlock(pageId, payload),
        {
          entity: entityLabel,
          fields,
          pageId,
          websiteId,
        },
      );

      return {
        pageId,
        fields,
        page: response.page,
      } as const;
    },

    onSuccess: async ({ pageId, fields, page }, variables) => {
      const pageIdKey = String(pageId ?? "").trim();

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

      logger.debug("create.ok", {
        websiteId,
        pageId,
        fields,
        returnedPageId: page?.id,
        returnedPageSlug: page?.slug,
      });

      onSuccess?.();
    },

    onError: (error: unknown) => {
      notify.fromError(error, UiError.unexpectedSave);

      logger.error("create.failed", {
        websiteId,
        msg: String(error),
      });
    },

    retry: false,
  });

  return {
    create: async (args) => {
      await mutation.mutateAsync(args);
    },
    isCreating: mutation.isPending,
  };
}

useCreateBlock.displayName = "useCreateBlock";
