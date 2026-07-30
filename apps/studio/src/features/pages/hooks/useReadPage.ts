"use client";

/**
 * @file apps/studio/src/features/pages/hooks/useReadPage.ts
 * @layer studio/features/pages/hooks
 *
 * @description
 * React Query hook for reading a page through the pages Studio API.
 *
 * @remarks
 * - Reads draft pages by default through `DEFAULT_CONTENT_STATE`.
 * - Uses load instrumentation with the requested content state for logs and notifications.
 * - Returns `PageDTO | null` so disabled queries remain easy for UI consumers to handle.
 * - Studio query keys are scoped by Prisma Website.id and content state.
 */

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type {
  PageDTO,
  PageWithRevisionsDTO,
} from "@compoz/core/domain/pages/dto";
import { pagesStudioApi } from "@compoz/infra/http/studio/pages.client";
import { log } from "@compoz/infra/lib/log";
import { useWebsiteId } from "@compoz/studio/features/admin/website/WebsiteContext";
import { pageByIdKey } from "@compoz/studio/features/pages/cache/keys";
import { mergePageRevisionedSnapshot } from "@compoz/studio/features/pages/cache/page-snapshot";
import { notify } from "@compoz/studio/lib/ui/notify";
import { withLoadLogs } from "@compoz/ui/hooks/instrumentation";

type UseReadPageResult = Readonly<{
  page: PageDTO | null;
  revisions: PageWithRevisionsDTO["revisions"] | null;
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

  const query = useQuery<PageWithRevisionsDTO, Error>({
    queryKey: pageByIdKey(websiteId, pageIdKey, state),
    enabled,

    structuralSharing: (current, incoming) =>
      mergePageRevisionedSnapshot(
        current as PageWithRevisionsDTO | undefined,
        incoming as PageWithRevisionsDTO,
      ),
    queryFn: async ({
      signal,
    }: {
      signal: AbortSignal;
    }): Promise<PageWithRevisionsDTO> => {
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
      return response;
    },
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
    page: enabled ? (query.data?.page ?? null) : null,
    revisions: enabled ? (query.data?.revisions ?? null) : null,
    isLoading: enabled ? query.isPending : false,
  };
}

useReadPage.displayName = "useReadPage";
