"use client";

/**
 * @file apps/studio/src/features/pages/blocks/cache/getPageBlocks.ts
 * @layer hooks/studio/pages/blocks
 * @description
 * Helpers React Query (SoT) pour récupérer les blocks d’une page (by pageId).
 */

import type { QueryClient } from "@tanstack/react-query";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { BlockDTO } from "@compoz/core/domain/pages/dto";
import type { HttpOpts } from "@compoz/infra/http/internal";
import { pagesStudioApi } from "@compoz/infra/http/studio/pages.client";
import { pageBlocksKey } from "@compoz/studio/features/pages/blocks/cache/keys";
import { toTenantId } from "@compoz/ui/lib/tenant-id";

export async function getPageBlocks(
  qc: QueryClient,
  tenantId: string,
  pageId: string,
  state: ContentState = DEFAULT_CONTENT_STATE,
  opts?: HttpOpts,
): Promise<ReadonlyArray<BlockDTO>> {
  const tid = toTenantId(tenantId);
  const pageIdKey = String(pageId ?? "").trim();

  if (!tid || !pageIdKey) return [];

  const key = pageBlocksKey(tid, pageIdKey, state);

  const cached = qc.getQueryData<ReadonlyArray<BlockDTO>>(key);
  if (cached) return cached;

  const blocks = await qc.fetchQuery<ReadonlyArray<BlockDTO>>({
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
