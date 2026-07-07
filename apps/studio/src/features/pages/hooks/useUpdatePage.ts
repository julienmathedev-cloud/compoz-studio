"use client";

/**
 * @file apps/studio/src/features/pages/hooks/useUpdatePage.ts
 * @layer studio/features/pages/hooks
 *
 * @description
 * React Query mutation hook for updating a draft page through the pages Studio API.
 *
 * @remarks
 * - Builds a minimal API patch from the shallow diff between baseline and next UI values.
 * - Handles no-change cases before calling the API.
 * - Tracks the targeted update through `updatingPageId` so only the matching page is blocked.
 * - Seeds the page-by-id cache and updates the SiteIndex cache from the returned payload.
 * - Invalidates site and page status views after update.
 * - Studio cache keys are scoped by Prisma Website.id.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import type { PageDTO } from "@compoz/core/domain/pages/dto";
import type { SiteIndexDTO } from "@compoz/core/domain/site/dto";
import { pagesStudioApi } from "@compoz/infra/http/studio/pages.client";
import type { UpdatePageResponse } from "@compoz/infra/http/studio/pages.types";
import { log } from "@compoz/infra/lib/log";
import { useWebsiteId } from "@compoz/studio/features/admin/website/WebsiteContext";
import { pageByIdKey } from "@compoz/studio/features/pages/cache/keys";
import { toUpdatePageIntentDTOFromFormValues } from "@compoz/studio/features/pages/mappers/pages-form";
import { setSiteIndexCache } from "@compoz/studio/features/site-index/cache";
import {
  invalidatePageStatusViews,
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

import type { PageFormValues } from "@compoz/validation/pages/page-form";
import type { UpdatePageIntentDTO } from "@compoz/validation/pages/page-intents";

type UpdatePageArgs = Readonly<{
  pageId: string;
  payload: UpdatePageIntentDTO;
  fields: ReadonlyArray<string>;
}>;

type UpdatePageMutationResult = Readonly<{
  pageId: string;
  nextSlug: string;
  fields: ReadonlyArray<string>;
  page: PageDTO;
  index?: SiteIndexDTO;
}>;

type UseUpdatePageResult = Readonly<{
  update: (
    pageId: string,
    baseline: PageFormValues,
    next: PageFormValues,
  ) => Promise<void>;
  updatingPageId: string | null;
  isUpdating: boolean;
}>;

const logger = log.child({ ns: "hook", name: "useUpdatePage" });

export function useUpdatePage(onSuccess?: () => void): UseUpdatePageResult {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const websiteId = useWebsiteId();

  const entityLabel = t("studio.shared.entities.page");

  const [updatingPageId, setUpdatingPageId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationKey: ["w", websiteId, "studio", "pages", "update"] as const,

    mutationFn: async (
      args: UpdatePageArgs,
    ): Promise<UpdatePageMutationResult> => {
      const { pageId, payload, fields } = args;

      const response = await withSaveLogs(
        "useUpdatePage",
        DEFAULT_CONTENT_STATE,
        async () => {
          const result: UpdatePageResponse = await pagesStudioApi.update(
            pageId,
            payload,
          );

          return result;
        },
        {
          entity: entityLabel,
          fields,
          pageId,
          websiteId,
        },
      );

      const page = response.page;
      const index = (response as Partial<UpdatePageResponse>).index;
      const nextSlug = String(payload.slug ?? "").trim();

      return {
        pageId,
        nextSlug,
        fields,
        page,
        index,
      } as const;
    },

    onSuccess: async ({ pageId, nextSlug, fields, page, index }) => {
      notifyUpdated(
        t("notifications.updated.title", { entity: entityLabel }),
        t("notifications.updated.description", { fields: fields.join(", ") }),
      );

      if (index) {
        setSiteIndexCache(queryClient, websiteId, DEFAULT_CONTENT_STATE, index);
      }

      queryClient.setQueryData(
        pageByIdKey(websiteId, pageId, DEFAULT_CONTENT_STATE),
        page,
      );

      await Promise.all([
        invalidateSiteStatus(queryClient, websiteId),
        invalidatePageStatusViews(queryClient, websiteId),
      ]);

      logger.debug("update.ok", {
        websiteId,
        pageId,
        nextSlug,
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
      setUpdatingPageId(null);
    },

    retry: false,
  });

  const update = useCallback(
    async (pageId: string, baseline: PageFormValues, next: PageFormValues) => {
      if (mutation.isPending) return;

      const pageIdKey = String(pageId ?? "").trim();

      if (!pageIdKey) {
        notify.error(
          t("uiErrors.errorGeneric"),
          t(ERROR_CODES.PAGE_ID_REQUIRED),
        );

        logger.error("update.invalidPageId", {
          websiteId,
          pageId,
        });

        return;
      }

      if (updatingPageId === pageIdKey) return;

      const uiPatch = buildShallowDiff<PageFormValues>(baseline, next) ?? null;

      if (!uiPatch) {
        notifyNoChanges(
          t("notifications.noChanges.title"),
          t("notifications.noChanges.description", { entity: entityLabel }),
        );

        return;
      }

      const payload = toUpdatePageIntentDTOFromFormValues(uiPatch);
      const fields = Object.keys(payload ?? {});

      if (fields.length === 0) {
        notifyNoChanges(
          t("notifications.noChanges.title"),
          t("notifications.noChanges.description", { entity: entityLabel }),
        );

        return;
      }

      setUpdatingPageId(pageIdKey);

      await mutation.mutateAsync({
        pageId: pageIdKey,
        payload,
        fields,
      });
    },
    [entityLabel, mutation, t, websiteId, updatingPageId],
  );

  return useMemo(
    () => ({
      update,
      updatingPageId,
      isUpdating: mutation.isPending,
    }),
    [update, updatingPageId, mutation.isPending],
  );
}

useUpdatePage.displayName = "useUpdatePage";
