"use client";

/**
 * @file apps/studio/src/features/pages/hooks/useCreatePage.ts
 * @layer hooks/studio/pages
 *
 * @description
 * Hook Studio React Query pour créer une page draft via l’API.
 *
 * @remarks
 * - Orchestration UI-only : mutation, logs, notifications.
 * - Le cache et les queryKeys sont scopés par Prisma Website.id.
 * - L’API résout le Website actif côté session/cookie.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { pagesStudioApi } from "@compoz/infra/http/studio/pages.client";
import { log } from "@compoz/infra/lib/log";
import { useWebsiteId } from "@compoz/studio/features/admin/website/WebsiteContext";
import { pageByIdKey } from "@compoz/studio/features/pages/cache/keys";
import { toCreatePageIntentDTOFromFormValues } from "@compoz/studio/features/pages/mappers/pages-form";
import { setSiteIndexCache } from "@compoz/studio/features/site-index/cache";
import {
  invalidatePageStatusViews,
  invalidateSiteStatus,
} from "@compoz/studio/features/site/status/invalidate";
import { notify } from "@compoz/studio/lib/ui/notify";
import { notifyCreated } from "@compoz/studio/lib/ui/notify-presets";
import { UiError } from "@compoz/studio/lib/ui/uiError";
import { withSaveLogs } from "@compoz/ui/hooks/instrumentation";

import type { PageFormValues } from "@compoz/validation/pages/page-form";
import type { CreatePageIntentDTO } from "@compoz/validation/pages/page-intents";

type UseCreatePageResult = Readonly<{
  create: (values: PageFormValues) => Promise<void>;
  isCreating: boolean;
}>;

const logger = log.child({ ns: "hook", name: "useCreatePage" });

export function useCreatePage(onSuccess?: () => void): UseCreatePageResult {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const websiteId = useWebsiteId();

  const entityLabel = t("studio.shared.entities.page");

  const mutation = useMutation({
    mutationKey: ["w", websiteId, "studio", "pages", "create"] as const,

    mutationFn: async (values: PageFormValues) => {
      const payload: CreatePageIntentDTO =
        toCreatePageIntentDTOFromFormValues(values);

      const fields = Object.keys(payload ?? {});

      const response = await withSaveLogs(
        "useCreatePage",
        DEFAULT_CONTENT_STATE,
        () => pagesStudioApi.create(payload),
        {
          entity: entityLabel,
          fields,
          websiteId,
        },
      );

      return {
        payload,
        fields,
        page: response.page,
        index: response.index,
      } as const;
    },

    onSuccess: async ({ payload, fields, page, index }) => {
      notifyCreated(
        t("notifications.created.title", { entity: entityLabel }),
        t("notifications.created.description", {
          entity: entityLabel,
          name: payload.name,
        }),
      );

      logger.debug("create.ok", {
        websiteId,
        pageId: page?.id,
        slug: page?.slug,
        fields,
        pagesInIndex: index?.pages?.length ?? undefined,
      });

      const pageIdValue = String(page?.id ?? "").trim();

      if (index) {
        setSiteIndexCache(queryClient, websiteId, DEFAULT_CONTENT_STATE, index);
      }

      if (pageIdValue) {
        queryClient.setQueryData(
          pageByIdKey(websiteId, pageIdValue, DEFAULT_CONTENT_STATE),
          page,
        );
      }

      await Promise.all([
        invalidateSiteStatus(queryClient, websiteId),
        invalidatePageStatusViews(queryClient, websiteId),
      ]);

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
    create: async (values) => {
      await mutation.mutateAsync(values);
    },
    isCreating: mutation.isPending,
  };
}

useCreatePage.displayName = "useCreatePage";
