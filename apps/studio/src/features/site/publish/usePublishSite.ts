"use client";

/**
 * @file apps/studio/src/features/site/publish/usePublishSite.ts
 * @layer studio/features/site/publish
 *
 * @description
 * React Query hook for publishing the draft site state to published.
 *
 * @remarks
 * - UI orchestration only: mutation, notifications, logs, and cache invalidation.
 * - The publish route and server use case remain the source of truth for business rules.
 * - Query keys and cache invalidations are scoped by Prisma Website.id.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { PublishSiteResultDTO } from "@compoz/core/domain/site/dto";
import { siteStudioApi } from "@compoz/infra/http/studio/site.client";
import type { PublishSiteResponse } from "@compoz/infra/http/studio/site.types";
import { log } from "@compoz/infra/lib/log";
import { useWebsiteId } from "@compoz/studio/features/admin/website/WebsiteContext";
import {
  invalidateSiteStatus,
  invalidateSiteStatusDetails,
} from "@compoz/studio/features/site/status/invalidate";
import { notify } from "@compoz/studio/lib/ui/notify";
import { UiError } from "@compoz/studio/lib/ui/uiError";
import { withSaveLogs } from "@compoz/ui/hooks/instrumentation";

type UsePublishSiteResult = Readonly<{
  publish: () => Promise<PublishSiteResultDTO | null>;
  isPublishing: boolean;
}>;

const logger = log.child({ ns: "hook", name: "usePublishSite" });

export function usePublishSite(onSuccess?: () => void): UsePublishSiteResult {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const websiteId = useWebsiteId();

  const mutation = useMutation({
    mutationKey: ["w", websiteId, "studio", "site", "publish"] as const,

    mutationFn: async (): Promise<PublishSiteResultDTO> => {
      const response: PublishSiteResponse = await withSaveLogs(
        "usePublishSite",
        DEFAULT_CONTENT_STATE,
        () =>
          siteStudioApi.publish({
            from: DEFAULT_CONTENT_STATE,
            to: "published",
            cleanOrphans: true,
          }),
        {
          entity: t("studio.shared.entities.site"),
          fields: ["publish"],
          websiteId,
        },
      );

      return response.publishResult;
    },

    onSuccess: async (publishResult) => {
      notify.success(
        t("studio.overviewSection.publish.success.title"),
        t("studio.overviewSection.publish.success.description"),
      );

      if (publishResult.warnings?.length) {
        notify.warning(
          t("studio.overviewSection.publish.warning.title"),
          t("studio.overviewSection.publish.warning.description", {
            count: publishResult.warnings.length,
          }),
        );
      }

      await Promise.all([
        invalidateSiteStatus(queryClient, websiteId),
        invalidateSiteStatusDetails(queryClient, websiteId),
      ]);

      logger.debug("publish.ok", {
        websiteId,
        from: publishResult.from,
        to: publishResult.to,
        pagesCopied: publishResult.pagesCopied,
        settingsCopied: publishResult.settingsCopied,
        warnings: publishResult.warnings.length,
      });

      onSuccess?.();
    },

    onError: (error: unknown) => {
      notify.fromError(error, UiError.unexpectedSave);

      logger.error("publish.failed", {
        websiteId,
        msg: String(error),
      });
    },

    retry: false,
  });

  const publish = useCallback(async () => {
    if (mutation.isPending) return null;

    return mutation.mutateAsync();
  }, [mutation]);

  return useMemo(
    () => ({
      publish,
      isPublishing: mutation.isPending,
    }),
    [publish, mutation.isPending],
  );
}

usePublishSite.displayName = "usePublishSite";
