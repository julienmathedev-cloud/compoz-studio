"use client";

/**
 * @file apps/studio/src/features/pages/hooks/useReorderPageChildren.ts
 * @layer hooks/admin/pages
 *
 * @description
 * Hook admin React Query : reorder des enfants d’un parent (index-only).
 *
 * @remarks
 * - Draft-only par défaut (WRITE_CONTENT_STATE).
 * - Orchestration UI-only (mutation + cache update + invalidation + logs + notifications).
 * - Aucune logique métier : la défense du set/order est côté route (reorderChildrenByParentId).
 *
 * @why cache update
 * Pour que l'UI (et la preview qui consomme `useReadSiteIndex`) reflète immédiatement
 * le nouvel ordre après un reorder, on pousse `index` dans le cache React Query via `setQueryData`.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  WRITE_CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";

import type { SiteIndexDTO } from "@compoz/core/domain/site/dto";
import { pagesAdminApi } from "@compoz/infra/http/studio/pages.client";
import { log, logSpan } from "@compoz/infra/lib/log";
import { setSiteIndexCache } from "@compoz/studio/features/site-index/cache";
import { notify } from "@compoz/studio/lib/ui/notify";
import { UiError } from "@compoz/studio/lib/ui/uiError";

type UseReorderPageChildrenResult = Readonly<{
  reorderChildren: (parentId: string, childIds: string[]) => Promise<void>;
  isReordering: boolean;
}>;

type ReorderChildrenArgs = Readonly<{
  parentId: string;
  childIds: string[];
}>;

const lg = log.child({ ns: "hook", name: "useReorderPageChildren" });

export function useReorderPageChildren(
  state: ContentState = WRITE_CONTENT_STATE,
): UseReorderPageChildrenResult {
  const qc = useQueryClient();

  const mutation = useMutation<SiteIndexDTO, unknown, ReorderChildrenArgs>({
    mutationKey: ["admin", "pages", "children", "reorder", state] as const,

    mutationFn: async ({ parentId, childIds }) => {
      const pid = String(parentId ?? "").trim();
      const ids = childIds ?? [];

      const res = await logSpan(
        "ui.pages.children.reorder",
        { state, parentId: pid, count: ids.length },
        () => pagesAdminApi.reorderChildren(pid, ids),
      );

      // ✅ index-only
      return res.index;
    },

    onSuccess: async (nextIndex, variables) => {
      // ✅ 1) push immédiat dans le cache (SoT helper)
      setSiteIndexCache(qc, state, nextIndex);

      lg.info("reorder.ok", {
        state,
        parentId: variables.parentId,
        count: variables.childIds.length,
      });
    },

    onError: (e: unknown) => {
      notify.fromError(e, UiError.unexpectedSave);
      lg.error("reorder.failed", { state, msg: String(e) });
    },

    retry: false,
  });

  return {
    reorderChildren: async (parentId, childIds) => {
      await mutation.mutateAsync({ parentId, childIds });
    },
    isReordering: mutation.isPending,
  } as const;
}

useReorderPageChildren.displayName = "useReorderPageChildren";
