"use client";

/**
 * @file apps/studio/src/features/pages/hooks/useReadPage.ts
 * @layer hooks/studio/pages
 *
 * @description
 * Hook Studio React Query pour lire une page via l’API.
 *
 * @remarks
 * - Website-scoped cache : toutes les query keys incluent `websiteId`.
 * - Orchestration UI-only : query, logs, notifications.
 * - Retourne `PageDTO | null` pour rester compatible avec l’UI.
 * - Aucune logique métier ni validation domaine.
 * - Le scope utilisé ici est Prisma Website.id.
 */

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { PageDTO } from "@compoz/core/domain/pages/dto";
import { pagesStudioApi } from "@compoz/infra/http/studio/pages.client";
import { log } from "@compoz/infra/lib/log";
import { useWebsiteId } from "@compoz/studio/features/admin/website/WebsiteContext";
import { pageByIdKey } from "@compoz/studio/features/pages/cache/keys";
import { notify } from "@compoz/studio/lib/ui/notify";
import { withLoadLogs } from "@compoz/ui/hooks/instrumentation";

type UseReadPageResult = Readonly<{
  page: PageDTO | null;
  isLoading: boolean;
}>;

const logger = log.child({ ns: "hook", name: "useReadPage" });

export function useReadPage(
  pageId: string,
  state: ContentState = DEFAULT_CONTENT_STATE,
): UseReadPageResult {
  const t = useTranslations();
  const websiteId = useWebsiteId();

  const entityLabel = t("studio.shared.entities.page");

  const pageIdKey = String(pageId ?? "").trim();
  const enabled = Boolean(websiteId && pageIdKey);

  const query = useQuery<PageDTO, Error>({
    queryKey: pageByIdKey(websiteId, pageIdKey, state),
    enabled,

    queryFn: async ({ signal }: { signal: AbortSignal }): Promise<PageDTO> => {
      const response = await withLoadLogs(
        "useReadPage",
        state,
        () => pagesStudioApi.getById(pageIdKey, state, { signal }),
        {
          entity: entityLabel,
          pageId: pageIdKey,
          websiteId,
        },
      );

      return response.page;
    },

    placeholderData: (previous: PageDTO | undefined) => previous,
  });

  useEffect(() => {
    if (!query.error) return;

    notify.fromError(query.error);

    logger.error("read.failed", {
      websiteId,
      pageId: pageIdKey,
      state,
      msg: String(query.error),
    });
  }, [query.error, websiteId, pageIdKey, state]);

  return {
    page: enabled ? (query.data ?? null) : null,
    isLoading: enabled ? query.isPending : false,
  };
}

useReadPage.displayName = "useReadPage";
