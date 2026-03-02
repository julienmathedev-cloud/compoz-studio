"use client";

/**
 * @file apps/studio/src/features/site/publish/usePublishSite.ts
 * @layer hooks/admin/site
 *
 * @description
 * Hook admin React Query pour publier le site (draft → published).
 *
 * @remarks
 * - Orchestration UI-only (mutation, logs, notifications).
 * - Invalide les queries liées à l’état du site (status + details).
 * - Aucune logique métier : la route + use-case sont la SoT.
 */

import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { siteAdminApi } from "@compoz/infra/http/studio/site.client";
import { log } from "@compoz/infra/lib/log";
import { withSaveLogs } from "@compoz/ui/hooks/instrumentation";
import { notify } from "@compoz/studio/lib/ui/notify";
import { UiError } from "@compoz/studio/lib/ui/uiError";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";

import type { PublishSiteResultDTO } from "@compoz/core/domain/site/dto";
import type { PublishSiteResponse } from "@compoz/infra/http/studio/site.types";

type UsePublishSiteResult = Readonly<{
  publish: () => Promise<PublishSiteResultDTO | null>;
  isPublishing: boolean;
}>;

const lg = log.child({ ns: "hook", name: "usePublishSite" });

export function usePublishSite(onSuccess?: () => void): UsePublishSiteResult {
  const t = useTranslations();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationKey: ["admin", "site", "publish"] as const,

    mutationFn: async (): Promise<PublishSiteResultDTO> => {
      const res: PublishSiteResponse = await withSaveLogs(
        "usePublishSite",
        WRITE_CONTENT_STATE,
        () =>
          siteAdminApi.publish({
            from: WRITE_CONTENT_STATE,
            to: "published",
            cleanOrphans: true,
          }),
        { entity: t("admin.shared.entities.site"), fields: ["publish"] },
      );

      // ✅ flatten ici
      return res.publishResult;
    },

    onSuccess: async (publishResult) => {
      notify.success(
        t("admin.overviewSection.publish.success.title"),
        t("admin.overviewSection.publish.success.description"),
      );

      if (publishResult.warnings?.length) {
        notify.warning(
          t("admin.overviewSection.publish.warning.title"),
          t("admin.overviewSection.publish.warning.description", {
            count: publishResult.warnings.length,
          }),
        );
      }

      await Promise.all([
        qc.invalidateQueries({
          queryKey: ["admin", "site", "status"] as const,
        }),
        qc.invalidateQueries({
          queryKey: ["admin", "site", "statusDetails"] as const,
        }),
      ]);

      lg.info("publish.ok", {
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
      lg.error("publish.failed", { msg: String(e) });
    },
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
