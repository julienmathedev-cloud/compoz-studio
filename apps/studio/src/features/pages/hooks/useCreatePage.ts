"use client";

/**
 * @file apps/studio/src/features/pages/hooks/useCreatePage.ts
 * @layer studio/features/pages/hooks
 *
 * @description
 * React Query mutation hook for creating a draft page through the pages Studio API.
 *
 * @remarks
 * - Converts UI form values to a create-page intent before calling the API.
 * - Uses save instrumentation with draft content state for logs and notifications.
 * - Seeds the page-by-id cache and updates the SiteIndex cache from the returned payload.
 * - Invalidates site and page status views after creation.
 * - Studio cache keys are scoped by Prisma Website.id; the API resolves Website access from the active session/cookie.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { pagesStudioApi } from "@compoz/infra/http/studio/pages.client";
import { log } from "@compoz/infra/lib/log";
import { useWebsiteId } from "@compoz/studio/features/admin/website/WebsiteContext";
import { seedCreatedPageCache } from "@compoz/studio/features/pages/cache/seed-created-page";
import { toCreatePageIntentDTOFromFormValues } from "@compoz/studio/features/pages/mappers/pages-form";
import {
  adoptDraftStructureConflict,
  draftStructureMutationOptions,
  requireDraftStructureSnapshot,
} from "@compoz/studio/features/pages/hooks/draft-structure-mutation";
import { setDraftStructureCache } from "@compoz/studio/features/site-index/cache";
import { siteIndexKey } from "@compoz/studio/features/site-index/keys";
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
    ...draftStructureMutationOptions(websiteId),

    mutationFn: async (values: PageFormValues) => {
      await queryClient.cancelQueries({
        queryKey: siteIndexKey(
          websiteId,
          DEFAULT_CONTENT_STATE,
        ),
        exact: true,
      });
      const snapshot = requireDraftStructureSnapshot(queryClient, websiteId);
      const payload: CreatePageIntentDTO =
        toCreatePageIntentDTOFromFormValues(
          values,
          snapshot.draftStructureRevision,
        );

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
        revisions: response.revisions,
        snapshot: {
          index: response.index,
          draftStructureRevision: response.draftStructureRevision,
        },
      } as const;
    },

    onSuccess: async ({ payload, fields, page, revisions, snapshot }) => {
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
        pagesInIndex: snapshot.index.pages.length,
      });

      const pageIdValue = String(page?.id ?? "").trim();

      setDraftStructureCache(
        queryClient,
        websiteId,
        DEFAULT_CONTENT_STATE,
        snapshot,
      );

      if (pageIdValue) {
        seedCreatedPageCache(queryClient, websiteId, DEFAULT_CONTENT_STATE, {
          page,
          revisions,
        });
      }

      await Promise.all([
        invalidateSiteStatus(queryClient, websiteId),
        invalidatePageStatusViews(queryClient, websiteId),
      ]);

      onSuccess?.();
    },

    onError: (error: unknown) => {
      adoptDraftStructureConflict(queryClient, websiteId, error);
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
