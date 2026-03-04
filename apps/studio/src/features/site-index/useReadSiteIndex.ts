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
import { useTenantId } from "@compoz/studio/features/admin/context/TenantContext";

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

  const tenantId = useTenantId();

  const enabled = Boolean(tenantId);

  const query = useQuery({
    queryKey: siteIndexKey(tenantId, state),
    enabled,

    queryFn: async ({ signal }): Promise<SiteIndexDTO> => {
      const res = await logSpan("ui.siteIndex.load", { tenantId, state }, () =>
        pagesAdminApi.getIndex(state, { signal }),
      );

      const index = res.index; // ✅ flatten

      lg.debug("read.ok", { tenantId, state, count: index.pages.length });
      return index;
    },

    // évite le flash si le state change / refetch
    placeholderData: (prev) => prev,
  } as const);

  useEffect(() => {
    if (!query.error) return;

    notify.fromError(query.error);
    lg.error("read.failed", {
      tenantId,
      state,
      entity: entityLabel,
      msg: String(query.error),
    });
  }, [query.error, tenantId, state, entityLabel]);

  return {
    index: enabled ? (query.data ?? null) : null,
    isLoading: enabled ? query.isPending : false,
  } as const;
}

useReadSiteIndex.displayName = "useReadSiteIndex";
