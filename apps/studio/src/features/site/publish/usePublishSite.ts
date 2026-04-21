"use client";

/**
 * @file apps/studio/src/features/site/publish/usePublishSite.ts
 * @layer hooks/studio/site
 *
 * @description
 * Hook Studio React Query pour publier le site (draft → published).
 *
 * @remarks
 * - Orchestration UI-only (mutation, logs, notifications).
 * - Invalide les queries liées à l’état du site (status + details).
 * - Aucune logique métier : la route + use-case sont la SoT.
 * - Tenant-scoped : les query keys incluent tenantId.
 */

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { PublishSiteResultDTO } from "@compoz/core/domain/site/dto";
import { siteStudioApi } from "@compoz/infra/http/studio/site.client";
import type { PublishSiteResponse } from "@compoz/infra/http/studio/site.types";
import { log } from "@compoz/infra/lib/log";
import { useTenantId } from "@compoz/studio/features/admin/tenant/TenantContext";
import {
  invalidateSiteStatus,
  invalidateSiteStatusDetails,
} from "@compoz/studio/features/site/status/invalidate";
import { notify } from "@compoz/studio/lib/ui/notify";
import { UiError } from "@compoz/studio/lib/ui/uiError";
import { withSaveLogs } from "@compoz/ui/hooks/instrumentation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";

type UsePublishSiteResult = Readonly<{
  publish: () => Promise<PublishSiteResultDTO | null>;
  isPublishing: boolean;
}>;

const lg = log.child({ ns: "hook", name: "usePublishSite" });

export function usePublishSite(onSuccess?: () => void): UsePublishSiteResult {
  const t = useTranslations();
  const qc = useQueryClient();
  const tenantId = useTenantId();

  const mutation = useMutation({
    mutationKey: ["t", tenantId, "studio", "site", "publish"] as const,

    mutationFn: async (): Promise<PublishSiteResultDTO> => {
      const res: PublishSiteResponse = await withSaveLogs(
        "usePublishSite",
        DEFAULT_CONTENT_STATE,
        () =>
          siteStudioApi.publish({
            from: DEFAULT_CONTENT_STATE,
            to: "published",
            cleanOrphans: true,
          }),
        { entity: t("studio.shared.entities.site"), fields: ["publish"] },
      );

      return res.publishResult;
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

      // ✅ SoT invalidations (tenant-scoped)
      await Promise.all([
        invalidateSiteStatus(qc, tenantId),
        invalidateSiteStatusDetails(qc, tenantId),
      ]);

      lg.debug("publish.ok", {
        tenantId,
        from: publishResult.from,
        to: publishResult.to,
        pagesCopied: publishResult.pagesCopied,
        settingsCopied: publishResult.settingsCopied,
        warnings: publishResult.warnings.length,
      });

      onSuccess?.();
    },

    onError: (e: unknown) => {
      notify.fromError(e, UiError.unexpectedSave);
      lg.error("publish.failed", { tenantId, msg: String(e) });
    },

    retry: false,
  });

  const publish = useCallback(async () => {
    if (mutation.isPending) return null;
    return mutation.mutateAsync();
  }, [mutation]);

  return useMemo(
    () =>
      ({
        publish,
        isPublishing: mutation.isPending,
      }) as const,
    [publish, mutation.isPending],
  );
}

usePublishSite.displayName = "usePublishSite";
