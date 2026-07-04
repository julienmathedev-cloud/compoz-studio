/**
 * @file apps/studio/src/features/pages/blocks/cache/cache-sync.ts
 * @layer hooks/studio/pages/blocks
 *
 * @description
 * Synchronise le cache React Query après une mutation block renvoyant `{ page }`.
 *
 * @remarks
 * - Le cache Studio est scopé par Website.id.
 * - Aucune URL publique n’est construite ici, donc pas de Website.slug.
 */

import type { QueryClient } from "@tanstack/react-query";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { PageDTO } from "@compoz/core/domain/pages/dto";
import { setPageBlocksCache } from "@compoz/studio/features/pages/blocks/cache/cache";
import { pageByIdKey } from "@compoz/studio/features/pages/cache/keys";

export function syncBlocksFromPageCache(
  queryClient: QueryClient,
  websiteId: string,
  pageId: string,
  page: PageDTO,
  state: ContentState = DEFAULT_CONTENT_STATE,
) {
  const websiteIdKey = String(websiteId ?? "").trim();
  const pageIdKey = String(pageId ?? "").trim();

  if (!websiteIdKey || !pageIdKey) return;

  queryClient.setQueryData(pageByIdKey(websiteIdKey, pageIdKey, state), page);

  setPageBlocksCache(
    queryClient,
    websiteIdKey,
    pageIdKey,
    state,
    page.blocks ?? [],
  );
}
