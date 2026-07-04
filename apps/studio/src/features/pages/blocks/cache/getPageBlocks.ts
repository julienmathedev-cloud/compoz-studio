"use client";

/**
 * @file apps/studio/src/features/pages/blocks/cache/getPageBlocks.ts
 * @layer hooks/studio/pages/blocks
 *
 * @description
 * Helper React Query pour récupérer les blocks d’une page par `pageId`.
 *
 * @remarks
 * - Le cache Studio est scopé par Prisma Website.id.
 * - L’API pages utilise le Website actif côté session.
 * - `websiteId` sert ici uniquement à isoler les queryKeys côté client.
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
