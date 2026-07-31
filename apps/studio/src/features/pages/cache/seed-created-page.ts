/**
 * @file apps/studio/src/features/pages/cache/seed-created-page.ts
 * @layer studio/features/pages/cache
 * @description Seeds the revisioned page cache from the authoritative creation response.
 */

import type { QueryClient } from "@tanstack/react-query";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import type { PageWithRevisionsDTO } from "@compoz/core/domain/pages/dto";
import { pageByIdKey } from "@compoz/studio/features/pages/cache/keys";

export function seedCreatedPageCache(
  queryClient: QueryClient,
  websiteId: string,
  state: ContentState,
  snapshot: PageWithRevisionsDTO,
): void {
  queryClient.setQueryData(
    pageByIdKey(websiteId, snapshot.page.id, state),
    snapshot,
  );
}
