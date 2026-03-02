/**
 * @file apps/studio/src/features/pages/blocks/cache/getPageBlocks.ts
 * @layer hooks/admin/pages/blocks
 * @description
 * Helpers React Query (SoT) pour les blocks d’une page (by id).
 */

"use client";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { QueryClient } from "@tanstack/react-query";

import type { BlockDTO } from "@compoz/core/domain/pages/dto"; // adapte
import type { HttpOpts } from "@compoz/infra/http/internal";
import { pagesAdminApi } from "@compoz/infra/http/studio/pages.client";
import { pageBlocksKey } from "@compoz/studio/features/pages/blocks/cache/keys";

export async function getPageBlocks(
  qc: QueryClient,
  pageId: string,
  state: ContentState = WRITE_CONTENT_STATE,
  opts?: HttpOpts,
): Promise<ReadonlyArray<BlockDTO>> {
  const pid = String(pageId ?? "").trim();
  const key = pageBlocksKey(pid, state);

  const cached = qc.getQueryData<ReadonlyArray<BlockDTO>>(key);
  if (cached) return cached;

  const blocks = await qc.fetchQuery<ReadonlyArray<BlockDTO>>({
    queryKey: key,
    queryFn: async ({ signal }) => {
      const res = await pagesAdminApi.getPageBlocks(pid, state, {
        signal: opts?.signal ?? signal,
      });
      return res.blocks; // ✅ flatten
    },
  });

  return blocks;
}
