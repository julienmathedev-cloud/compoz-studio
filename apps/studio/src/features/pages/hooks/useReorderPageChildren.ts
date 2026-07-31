"use client";

/**
 * @file apps/studio/src/features/pages/hooks/useReorderPageChildren.ts
 * @layer studio/features/pages/hooks
 *
 * @description
 * React Query mutation hook for reordering draft child pages through the pages Studio API.
 *
 * @remarks
 * - Uses draft content state by default through `DEFAULT_CONTENT_STATE`.
 * - The API route owns set/order validation for the requested parent children.
 * - Updates the SiteIndex cache from the returned payload so UI and preview order reflect the reorder immediately.
 * - Studio cache keys are scoped by Prisma Website.id and content state.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  DEFAULT_CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";
import type { DraftSiteIndexWithRevisionDTO } from "@compoz/core/domain/site/dto";
import type { ReorderChildrenResponse } from "@compoz/infra/http/studio/pages.types";
import { pagesStudioApi } from "@compoz/infra/http/studio/pages.client";
import { log, logSpan } from "@compoz/infra/lib/log";
import { useWebsiteId } from "@compoz/studio/features/admin/website/WebsiteContext";
import {
  adoptDraftStructureConflict,
  draftStructureMutationOptions,
  requireDraftStructureSnapshot,
} from "@compoz/studio/features/pages/hooks/draft-structure-mutation";
import {
  patchDraftStructureCache,
  rollbackDraftStructureReorder,
  setDraftStructureCache,
  type ReorderOptimisticContext,
} from "@compoz/studio/features/site-index/cache";
import { siteIndexKey } from "@compoz/studio/features/site-index/keys";
import {
  invalidateSiteStatus,
  invalidateSiteStatusDetails,
} from "@compoz/studio/features/site/status/invalidate";
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

function optimisticReorder(
  snapshot: DraftSiteIndexWithRevisionDTO,
  parentId: string,
  childIds: ReadonlyArray<string>,
): DraftSiteIndexWithRevisionDTO {
  const children = snapshot.index.pages.filter(
    (page) => page.parentId === parentId,
  );
  const byId = new Map(children.map((page) => [page.id, page]));
  let cursor = 0;

  return {
    ...snapshot,
    index: {
      ...snapshot.index,
      pages: snapshot.index.pages.map((page) =>
        page.parentId === parentId
          ? (byId.get(childIds[cursor++]) ?? page)
          : page,
      ),
    },
  };
}

export function useReorderPageChildren(
  state: ContentState = DEFAULT_CONTENT_STATE,
): UseReorderPageChildrenResult {
  const queryClient = useQueryClient();
  const websiteId = useWebsiteId();

  const mutation = useMutation<
    ReorderChildrenResponse,
    unknown,
    ReorderChildrenArgs,
    ReorderOptimisticContext
  >({
    ...draftStructureMutationOptions(websiteId),

    mutationFn: async ({ parentId, childIds }) => {
      const parentIdKey = String(parentId ?? "").trim();
      const orderedChildIds = childIds ?? [];
      await queryClient.cancelQueries({
        queryKey: siteIndexKey(websiteId, state),
        exact: true,
      });
      const current = requireDraftStructureSnapshot(
        queryClient,
        websiteId,
      );

      const response = await logSpan(
        "ui.pages.children.reorder",
        {
          state,
          websiteId,
          parentId: parentIdKey,
          count: orderedChildIds.length,
        },
        () =>
          pagesStudioApi.reorderChildren(parentIdKey, {
            childIds: orderedChildIds,
            expectedDraftStructureRevision:
              current.draftStructureRevision,
          }),
      );

      return response;
    },

    onMutate: async ({ parentId, childIds }) => {
      await queryClient.cancelQueries({
        queryKey: siteIndexKey(websiteId, state),
        exact: true,
      });
      const before = requireDraftStructureSnapshot(
        queryClient,
        websiteId,
      );
      const optimistic = optimisticReorder(
        before,
        parentId,
        childIds,
      );
      patchDraftStructureCache(
        queryClient,
        websiteId,
        state,
        () => optimistic,
      );
      return {
        before,
        optimistic,
        parentPageId: parentId,
        orderedPageIdsBefore: before.index.pages
          .filter((page) => page.parentId === parentId)
          .map((page) => page.id),
        orderedPageIdsOptimistic: [...childIds],
      };
    },

    onSuccess: async (nextSnapshot, variables) => {
      setDraftStructureCache(queryClient, websiteId, state, nextSnapshot);

      if (nextSnapshot.outcome === "updated") {
        await Promise.all([
          invalidateSiteStatus(queryClient, websiteId),
          invalidateSiteStatusDetails(queryClient, websiteId),
        ]);
      }

      logger.debug("reorder.ok", {
        websiteId,
        state,
        parentId: variables.parentId,
        count: variables.childIds.length,
      });
    },

    onError: (error: unknown, _variables, context) => {
      const adopted = adoptDraftStructureConflict(
        queryClient,
        websiteId,
        error,
      );
      if (!adopted && context) {
        patchDraftStructureCache(
          queryClient,
          websiteId,
          state,
          (current) =>
            rollbackDraftStructureReorder(current, context),
        );
      }
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

      if (!parentIdKey) {
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
