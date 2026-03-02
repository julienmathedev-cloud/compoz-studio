/**
 * @file apps/studio/src/features/pages/cache/keys.ts
 * @layer hooks/admin/pages
 *
 * @description
 * Helpers pour construire des query keys React Query liées aux pages.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";

/**
 * ✅ Source de vérité : queryKey "page by id"
 * Permet de seed/patch le cache depuis les mutations (create/update/delete).
 */
export function pageByIdKey(pageId: string, state: ContentState) {
  const id = String(pageId ?? "").trim();
  return ["admin", "pages", "byId", id, state] as const;
}
