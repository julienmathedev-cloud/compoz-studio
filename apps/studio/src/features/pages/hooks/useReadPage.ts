"use client";

/**
 * @file apps/studio/src/features/pages/hooks/useReadPage.ts
 * @layer hooks/studio/pages
 *
 * @description
 * Hook studio React Query pour lire une page via l’API.
 *
 * @remarks
 * - Tenant-scoped cache : toutes les query keys incluent `tenantId`.
 * - Orchestration UI-only (query, logs, notifications).
 * - Retourne `PageDTO | null` pour rester compatible avec l’UI.
 * - Aucune logique métier ni validation domaine.
 */

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { PageDTO } from "@compoz/core/domain/pages/dto";
import { pagesStudioApi } from "@compoz/infra/http/studio/pages.client";
import { log } from "@compoz/infra/lib/log";
import { useTenantId } from "@compoz/studio/features/admin/tenant/TenantContext";
import { pageByIdKey } from "@compoz/studio/features/pages/cache/keys";
import { notify } from "@compoz/studio/lib/ui/notify";
import { withLoadLogs } from "@compoz/ui/hooks/instrumentation";

type UseReadPageResult = Readonly<{
  page: PageDTO | null;
  isLoading: boolean;
}>;

const lg = log.child({ ns: "hook", name: "useReadPage" });

export function useReadPage(
  pageId: string,
  state: ContentState = DEFAULT_CONTENT_STATE,
): UseReadPageResult {
  const t = useTranslations();
  const tenantId = useTenantId();
  const entityLabel = t("studio.shared.entities.page");

  const pageIdKey = String(pageId ?? "").trim();
  const enabled = Boolean(tenantId && pageIdKey);

  const options = {
    queryKey: pageByIdKey(tenantId, pageIdKey, state),
    enabled,

    queryFn: async ({ signal }: { signal: AbortSignal }): Promise<PageDTO> => {
      const res = await withLoadLogs(
        "useReadPage",
        state,
        () => pagesStudioApi.getById(pageIdKey, state, { signal }),
        { entity: entityLabel, pageId: pageIdKey, tenantId },
      );

      return res.page;
    },

    placeholderData: (prev: PageDTO | undefined) => prev,
  } as const;

  const query = useQuery<PageDTO, Error>(options);

  useEffect(() => {
    if (!query.error) return;

    notify.fromError(query.error);

    lg.error("read.failed", {
      tenantId,
      pageId: pageIdKey,
      state,
      msg: String(query.error),
    });
  }, [query.error, tenantId, pageIdKey, state]);

  return {
    page: enabled ? (query.data ?? null) : null,
    isLoading: enabled ? query.isPending : false,
  } as const;
}

useReadPage.displayName = "useReadPage";
