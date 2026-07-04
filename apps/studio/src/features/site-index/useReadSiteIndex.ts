"use client";

/**
 * @file apps/studio/src/features/site-index/useReadSiteIndex.ts
 * @layer hooks/admin/site
 *
 * @description
 * Hook admin React Query pour charger le SiteIndex.
 *
 * @remarks
 * - Orchestration UI-only : query + logs + notifications.
 * - Utilise `AbortSignal` fourni par React Query.
 * - Draft-only par défaut : DEFAULT_CONTENT_STATE.
 * - Aucune logique métier ni validation domaine.
 * - Website-scoped : la queryKey inclut Prisma Website.id.
 * - `SiteIndex` désigne ici un read-model UI des pages du Website actif.
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
  /** Dernier index chargé, ou `null` tant que rien n’a été récupéré. */
  index: SiteIndexDTO | null;

  /** `true` pendant un chargement initial. */
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

    /**
     * Évite le flash si le state change ou pendant un refetch.
     */
    placeholderData: (previous: SiteIndexDTO | undefined) => previous,
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
