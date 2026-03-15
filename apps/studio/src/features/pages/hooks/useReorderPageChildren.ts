"use client";

/**
 * @file apps/studio/src/features/pages/hooks/useReorderPageChildren.ts
 * @layer hooks/studio/pages
 *
 * @description
 * Hook studio React Query : réordonnancement des enfants d’un parent (index-only).
 *
 * @remarks
 * - Draft-only par défaut (`DEFAULT_CONTENT_STATE`).
 * - Orchestration UI-only (mutation + cache update + logs + notifications).
 * - Aucune logique métier : la défense du set / order est côté route.
 *
 * @why cache update
 * Pour que l’UI (et la preview qui consomme `useReadSiteIndex`) reflète immédiatement
 * le nouvel ordre après un reorder, on pousse `index` dans le cache React Query via `setQueryData`.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  DEFAULT_CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";
import type { SiteIndexDTO } from "@compoz/core/domain/site/dto";
import { pagesStudioApi } from "@compoz/infra/http/studio/pages.client";
import { log, logSpan } from "@compoz/infra/lib/log";
import { useTenantId } from "@compoz/studio/features/admin/tenant/TenantContext";
import { setSiteIndexCache } from "@compoz/studio/features/site-index/cache";
import { notify } from "@compoz/studio/lib/ui/notify";
import { UiError } from "@compoz/studio/lib/ui/uiError";

type ReorderChildrenArgs = Readonly<{
  parentId: string;
  childIds: string[];
}>;

type UseReorderPageChildrenResult = Readonly<{
  reorderChildren: (parentId: string, childIds: string[]) => Promise<void>;
  isReordering: boolean;
}>;

const lg = log.child({ ns: "hook", name: "useReorderPageChildren" });

export function useReorderPageChildren(
  state: ContentState = DEFAULT_CONTENT_STATE,
): UseReorderPageChildrenResult {
  const qc = useQueryClient();
  const tenantId = useTenantId();

  const mutation = useMutation<SiteIndexDTO, unknown, ReorderChildrenArgs>({
    mutationKey: [
      "t",
      tenantId,
      "studio",
      "pages",
      "children",
      "reorder",
      state,
    ] as const,

    mutationFn: async ({ parentId, childIds }) => {
      const parentIdKey = String(parentId ?? "").trim();
      const orderedChildIds = childIds ?? [];

      const response = await logSpan(
        "ui.pages.children.reorder",
        { state, parentId: parentIdKey, count: orderedChildIds.length },
        () => pagesStudioApi.reorderChildren(parentIdKey, orderedChildIds),
      );

      return response.index;
    },

    onSuccess: async (nextIndex, variables) => {
      setSiteIndexCache(qc, tenantId, state, nextIndex);

      lg.info("reorder.ok", {
        state,
        parentId: variables.parentId,
        count: variables.childIds.length,
      });
    },

    onError: (error: unknown) => {
      notify.fromError(error, UiError.unexpectedSave);
      lg.error("reorder.failed", { state, msg: String(error) });
    },

    retry: false,
  });

  return {
    reorderChildren: async (parentId, childIds) => {
      const parentIdKey = String(parentId ?? "").trim();
      const orderedChildIds = childIds ?? [];

      if (!parentIdKey || orderedChildIds.length === 0) {
        return;
      }

      await mutation.mutateAsync({
        parentId: parentIdKey,
        childIds: orderedChildIds,
      });
    },
    isReordering: mutation.isPending,
  } as const;
}

useReorderPageChildren.displayName = "useReorderPageChildren";
