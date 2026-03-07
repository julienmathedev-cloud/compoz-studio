/**
 * @file apps/studio/src/features/pages/blocks/cache/cache-sync.ts
 * @layer hooks/studio/pages/blocks
 *
 * @description
 * Synchronise le cache React Query après une mutation block renvoyant `{ page }`.
 */

import type { QueryClient } from "@tanstack/react-query";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { PageDTO } from "@compoz/core/domain/pages/dto";
import { setPageBlocksCache } from "@compoz/studio/features/pages/blocks/cache/cache";
import { pageByIdKey } from "@compoz/studio/features/pages/cache/keys";

export function syncBlocksFromPageCache(
  qc: QueryClient,
  tenantId: string,
  pageId: string,
  page: PageDTO,
  state: ContentState = DEFAULT_CONTENT_STATE,
) {
  const pageIdKey = String(pageId ?? "").trim();
  if (!pageIdKey) return;

  qc.setQueryData(pageByIdKey(tenantId, pageIdKey, state), page);
  setPageBlocksCache(qc, tenantId, pageIdKey, state, page.blocks ?? []);
}
