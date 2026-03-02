/**
 * @file apps/studio/src/features/pages/cache/cache.ts
 * @layer hooks/admin/pages
 *
 * Helpers cache React Query (SoT) pour PageDTO (by id).
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import type { PageDTO } from "@compoz/core/domain/pages/dto";
import type { QueryClient } from "@tanstack/react-query";
import { pageByIdKey } from "@compoz/studio/features/pages/cache/keys";

export function setPageCache(
  qc: QueryClient,
  pageId: string,
  state: ContentState,
  next: PageDTO,
) {
  const pid = String(pageId ?? "").trim();
  if (!pid) return;

  qc.setQueryData(pageByIdKey(pid, state), next);
}

export function patchPageCache(
  qc: QueryClient,
  pageId: string,
  state: ContentState,
  patcher: (prev: PageDTO) => PageDTO,
) {
  const pid = String(pageId ?? "").trim();
  if (!pid) return;

  qc.setQueryData(pageByIdKey(pid, state), (prev: PageDTO | undefined) => {
    if (!prev) return prev;
    return patcher(prev);
  });
}

export function removePageCache(
  qc: QueryClient,
  pageId: string,
  state: ContentState,
) {
  const pid = String(pageId ?? "").trim();
  if (!pid) return;

  qc.removeQueries({
    queryKey: pageByIdKey(pid, state),
    exact: true,
  });
}
