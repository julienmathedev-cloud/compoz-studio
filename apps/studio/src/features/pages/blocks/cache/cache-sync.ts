/**
 * @file apps/studio/src/features/pages/blocks/cache/cache-sync.ts
 * @layer hooks/admin/pages/blocks
 *
 * @description
 * Sync cache React Query après une mutation block renvoyant { page }.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { PageDTO } from "@compoz/core/domain/pages/dto";
import type { QueryClient } from "@tanstack/react-query";

import { setPageBlocksCache } from "@compoz/studio/features/pages/blocks/cache/cache";
import { pageByIdKey } from "@compoz/studio/features/pages/cache/keys";

export function syncBlocksFromPageCache(
  qc: QueryClient,
  tenantId: string,
  pageId: string,
  page: PageDTO,
  state: ContentState = WRITE_CONTENT_STATE,
) {
  const pid = String(pageId ?? "").trim();
  if (!pid) return;

  // 1) page-by-id
  qc.setQueryData(pageByIdKey(tenantId, pid, state), page);

  // 2) blocks list by pageId
  setPageBlocksCache(qc, tenantId, pid, state, page.blocks ?? []);
}
