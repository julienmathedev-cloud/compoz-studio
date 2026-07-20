"use client";

/**
 * @file apps/studio/src/features/site-index/useReadSiteIndex.ts
 * @layer studio/features/site-index
 *
 * @description
 * React Query hook for reading the Studio SiteIndex.
 *
 * @remarks
 * - Defaults to the draft content state used by Studio editors.
 * - Uses the `AbortSignal` provided by React Query for cancellable reads.
 * - The query key is scoped by Prisma Website.id to avoid cache collisions when switching the active website.
 * - `SiteIndex` is the UI read model for pages of the active website.
 */

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import {
  DEFAULT_CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";
import type { SiteIndexDTO } from "@compoz/core/domain/site/dto";
import { pagesStudioApi } from "@compoz/infra/http/studio/pages.client";
import { log, logSpan } from "@compoz/infra/lib/log";
import { useWebsiteId } from "@compoz/studio/features/admin/website/WebsiteContext";
import { siteIndexKey } from "@compoz/studio/features/site-index/keys";
import { notify } from "@compoz/studio/lib/ui/notify";

type UseReadSiteIndexResult = Readonly<{
  index: SiteIndexDTO | null;

  isLoading: boolean;
}>;

const logger = log.child({ ns: "hook", name: "useReadSiteIndex" });

export function useReadSiteIndex(
  state: ContentState = DEFAULT_CONTENT_STATE,
): UseReadSiteIndexResult {
  const t = useTranslations();
  const websiteId = useWebsiteId();

  const entityLabel = t("studio.shared.entities.siteIndex");
  const enabled = Boolean(String(websiteId ?? "").trim());

  const query = useQuery<SiteIndexDTO, Error>({
    queryKey: siteIndexKey(websiteId, state),
    enabled,

    queryFn: async ({
      signal,
    }: {
      signal: AbortSignal;
    }): Promise<SiteIndexDTO> => {
      const response = await logSpan(
        "ui.siteIndex.load",
        {
          websiteId,
          state,
        },
        () => pagesStudioApi.getIndex(state, { signal }),
      );

      const index = response.index;

      logger.debug("read.ok", {
        websiteId,
        state,
        count: index.pages.length,
      });

      return index;
    },
  });

  useEffect(() => {
    if (!query.error) return;

    notify.fromError(query.error);

    logger.error("read.failed", {
      websiteId,
      state,
      entity: entityLabel,
      msg: String(query.error),
    });
  }, [query.error, websiteId, state, entityLabel]);

  return {
    index: enabled ? (query.data ?? null) : null,
    isLoading: enabled ? query.isPending : false,
  };
}

useReadSiteIndex.displayName = "useReadSiteIndex";
