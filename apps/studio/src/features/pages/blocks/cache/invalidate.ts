/**
 * @file apps/studio/src/features/pages/blocks/cache/invalidate.ts
 * @layer hooks/studio/pages/blocks
 *
 * @description
 * Helpers React Query pour invalider le cache des blocks d’une page.
 *
 * @remarks
 * - Le cache Studio est scopé par Prisma Website.id.
 * - Aucune route publique n’est construite ici, donc pas de Website.slug.
 */

import type { QueryClient } from "@tanstack/react-query";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { pageBlocksKey } from "@compoz/studio/features/pages/blocks/cache/keys";

export function invalidateDraftBlocksList(
  queryClient: QueryClient,
  websiteId: string,
  pageId: string,
) {
  const websiteIdKey = String(websiteId ?? "").trim();
  const pageIdKey = String(pageId ?? "").trim();

  if (!websiteIdKey || !pageIdKey) return;

  return queryClient.invalidateQueries({
    queryKey: pageBlocksKey(websiteIdKey, pageIdKey, DEFAULT_CONTENT_STATE),
  });
}
