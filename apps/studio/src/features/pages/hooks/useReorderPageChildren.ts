"use client";

/**
 * @file apps/studio/src/features/pages/hooks/useReorderPageChildren.ts
 * @layer hooks/studio/pages
 *
 * @description
 * Hook Studio React Query : réordonnancement des enfants d’un parent.
 *
 * @remarks
 * - Draft-only par défaut (`DEFAULT_CONTENT_STATE`).
 * - Orchestration UI-only : mutation + cache update + logs + notifications.
 * - Aucune logique métier : la défense du set / order est côté route.
 * - Le cache est scopé par Prisma Website.id.
 *
 * @why cache update
 * Pour que l’UI et la preview qui consomme `useReadSiteIndex` reflètent
 * immédiatement le nouvel ordre après un reorder, on pousse `index` dans le
 * cache React Query via `setQueryData`.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  DEFAULT_CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";
import type { SiteIndexDTO } from "@compoz/core/domain/site/dto";
import { pagesStudioApi } from "@compoz/infra/http/studio/pages.client";
import { log, logSpan } from "@compoz/infra/lib/log";
import { useWebsiteId } from "@compoz/studio/features/admin/website/WebsiteContext";
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

const logger = log.child({ ns: "hook", name: "useReorderPageChildren" });

export function useReorderPageChildren(
  state: ContentState = DEFAULT_CONTENT_STATE,
): UseReorderPageChildrenResult {
  const queryClient = useQueryClient();
  const websiteId = useWebsiteId();

  const mutation = useMutation<SiteIndexDTO, unknown, ReorderChildrenArgs>({
    mutationKey: [
      "w",
      websiteId,
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
        {
          state,
          websiteId,
          parentId: parentIdKey,
          count: orderedChildIds.length,
        },
        () => pagesStudioApi.reorderChildren(parentIdKey, orderedChildIds),
      );

      return response.index;
    },

    onSuccess: async (nextIndex, variables) => {
      setSiteIndexCache(queryClient, websiteId, state, nextIndex);

      logger.debug("reorder.ok", {
        websiteId,
        state,
        parentId: variables.parentId,
        count: variables.childIds.length,
      });
    },

    onError: (error: unknown) => {
      notify.fromError(error, UiError.unexpectedSave);

      logger.error("reorder.failed", {
        websiteId,
        state,
        msg: String(error),
      });
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
  };
}

useReorderPageChildren.displayName = "useReorderPageChildren";
