"use client";

/**
 * @file apps/studio/src/features/site-index/useReadSiteIndex.ts
 * @layer hooks/admin/site
 *
 * @description
 * Hook admin React Query pour charger l’index du site.
 *
 * @remarks
 * - Orchestration UI-only (query + logs + notifications).
 * - Utilise `AbortSignal` fourni par React Query.
 * - Draft-only par défaut : WRITE_CONTENT_STATE.
 * - Aucune logique métier ni validation domaine.
 */

import { log, logSpan } from "@compoz/infra/lib/log";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { SiteIndexDTO } from "@compoz/core/domain/site/dto";
import { pagesAdminApi } from "@compoz/infra/http/studio/pages.client";
import { siteIndexKey } from "@compoz/studio/features/site-index/keys";
import { notify } from "@compoz/studio/lib/ui/notify";

import type { ContentState } from "@compoz/core/constants/common/content-state";

type UseReadSiteIndexResult = Readonly<{
  /** Dernier index chargé (ou `null` tant que rien n’a été récupéré). */
  index: SiteIndexDTO | null;
  /** `true` pendant un (re)chargement (initial). */
  isLoading: boolean;
}>;

const lg = log.child({ ns: "hook", name: "useReadSiteIndex" });

export function useReadSiteIndex(
  state: ContentState = WRITE_CONTENT_STATE,
): UseReadSiteIndexResult {
  const t = useTranslations();
  const entityLabel = t("admin.shared.entities.siteIndex");

  const query = useQuery({
    queryKey: siteIndexKey(state),

    queryFn: async ({ signal }): Promise<SiteIndexDTO> => {
      const res = await logSpan("ui.siteIndex.load", { state }, () =>
        pagesAdminApi.getIndex(state, { signal }),
      );

      const index = res.index; // ✅ flatten

      lg.debug("read.ok", { state, count: index.pages.length });
      return index;
    },

    // évite le flash si le state change / refetch
    placeholderData: (prev) => prev,
  } as const);

  useEffect(() => {
    if (!query.error) return;

    notify.fromError(query.error);
    lg.error("read.failed", {
      state,
      entity: entityLabel,
      msg: String(query.error),
    });
  }, [query.error, state, entityLabel]);

  return {
    index: query.data ?? null,
    isLoading: query.isPending,
  } as const;
}
