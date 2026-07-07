"use client";

/**
 * @file apps/studio/src/features/pages/blocks/cache/getPageBlocks.ts
 * @layer studio/features/pages/blocks/cache
 *
 * @description
 * React Query helper for reading a page block list by page id.
 *
 * @remarks
 * - Returns cached blocks when the derived block-list cache is already populated.
 * - Fetches through the pages Studio API when the cache is empty.
 * - Studio query keys are scoped by Prisma Website.id and content state.
 * - The pages API resolves Website access from the active session; `websiteId` only isolates client-side query keys here.
 */

import type { QueryClient } from "@tanstack/react-query";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { BlockDTO } from "@compoz/core/domain/pages/dto";
import type { HttpOpts } from "@compoz/infra/http/internal";
import { pagesStudioApi } from "@compoz/infra/http/studio/pages.client";
import { pageBlocksKey } from "@compoz/studio/features/pages/blocks/cache/keys";

export async function getPageBlocks(
  queryClient: QueryClient,
  websiteId: string,
  pageId: string,
  state: ContentState = DEFAULT_CONTENT_STATE,
  opts?: HttpOpts,
): Promise<ReadonlyArray<BlockDTO>> {
  const websiteIdKey = String(websiteId ?? "").trim();
  const pageIdKey = String(pageId ?? "").trim();

  if (!websiteIdKey || !pageIdKey) return [];

  const key = pageBlocksKey(websiteIdKey, pageIdKey, state);

  const cached = queryClient.getQueryData<ReadonlyArray<BlockDTO>>(key);

  if (cached) return cached;

  const blocks = await queryClient.fetchQuery<ReadonlyArray<BlockDTO>>({
    queryKey: key,
    queryFn: async ({ signal }) => {
      const res = await pagesStudioApi.getPageBlocks(pageIdKey, state, {
        signal: opts?.signal ?? signal,
      });

      return res.blocks;
    },
  });

  return blocks;
}
