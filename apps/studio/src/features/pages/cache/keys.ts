/**
 * @file apps/studio/src/features/pages/cache/keys.ts
 * @layer hooks/admin/pages
 *
 * @description
 * Helpers pour construire des query keys React Query liées aux pages.
 *
 * @remarks
 * - Tenant-scoped : on préfixe par ["t", tenantId, ...]
 *   pour éviter les collisions de cache lors d'un switch tenant.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";

/**
 * ✅ Source de vérité : queryKey "page by id"
 * Permet de seed/patch le cache depuis les mutations (create/update/delete).
 */
export function pageByIdKey(
  tenantId: string,
  pageId: string,
  state: ContentState,
) {
  const tId = String(tenantId ?? "")
    .trim()
    .toLowerCase();

  const id = String(pageId ?? "").trim();

  return ["t", tId, "admin", "pages", "byId", id, state] as const;
}
