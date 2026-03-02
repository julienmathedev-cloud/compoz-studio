"use client";

/**
 * @file apps/studio/src/features/pages/hooks/useReadPage.ts
 * @layer hooks/admin/pages
 *
 * @description
 * Hook admin React Query pour lire une page via l’API.
 *
 * @remarks
 * - Orchestration UI-only (query, logs, notifications).
 * - Retourne `PageDTO | null` pour rester compatible avec l’UI.
 * - Aucune logique métier ni validation domaine.
 */

import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { log } from "@compoz/infra/lib/log";
import { withLoadLogs } from "@compoz/ui/hooks/instrumentation";
import { notify } from "@compoz/studio/lib/ui/notify";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { pagesAdminApi } from "@compoz/infra/http/studio/pages.client";
import { pageByIdKey } from "@compoz/studio/features/pages/cache/keys";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import type { PageDTO } from "@compoz/core/domain/pages/dto";

type UseReadPageResult = Readonly<{
  page: PageDTO | null;
  isLoading: boolean;
}>;

const lg = log.child({ ns: "hook", name: "useReadPage" });

export function useReadPage(
  pageId: string,
  state: ContentState = WRITE_CONTENT_STATE,
): UseReadPageResult {
  const t = useTranslations();
  const entityLabel = t("admin.shared.entities.page");

  const pageIdKey = String(pageId ?? "").trim();
  const enabled = Boolean(pageIdKey);

  const options = {
    queryKey: pageByIdKey(pageIdKey, state),
    enabled,

    queryFn: async ({ signal }: { signal: AbortSignal }): Promise<PageDTO> => {
      const res = await withLoadLogs(
        "useReadPage",
        state,
        () => pagesAdminApi.getById(pageIdKey, state, { signal }),
        { entity: entityLabel, pageId: pageIdKey },
      );

      // ✅ flatten route response
      return res.page;
    },

    placeholderData: (prev: PageDTO | undefined) => prev,
  } as const;

  const query = useQuery<PageDTO, Error>(options);

  useEffect(() => {
    if (!query.error) return;
    notify.fromError(query.error);
    lg.error("read.failed", {
      pageId: pageIdKey,
      state,
      msg: String(query.error),
    });
  }, [query.error, pageIdKey, state]);

  return {
    page: enabled ? (query.data ?? null) : null,
    isLoading: enabled ? query.isPending : false,
  } as const;
}

useReadPage.displayName = "useReadPage";
