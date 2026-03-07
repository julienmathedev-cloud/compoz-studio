/**
 * @file apps/studio/src/features/pages/cache/keys.ts
 * @layer hooks/studio/pages
 *
 * @description
 * Helpers pour construire des query keys React Query liées aux pages.
 *
 * @remarks
 * - Tenant-scoped : préfixe `["t", tenantId, ...]`
 *   pour éviter les collisions de cache lors d’un switch tenant.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { requireTenantId } from "@compoz/ui/lib/tenant-id";

/**
 * Source de vérité : query key "page by id".
 *
 * @remarks
 * Permet de seed / patch le cache depuis les mutations (create / update / delete).
 */
export function pageByIdKey(
  tenantId: string,
  pageId: string,
  state: ContentState,
) {
  const tid = requireTenantId(tenantId, "pageByIdKey tenantId");

  const id = String(pageId ?? "").trim();

  return ["t", tid, "studio", "pages", "byId", id, state] as const;
}
