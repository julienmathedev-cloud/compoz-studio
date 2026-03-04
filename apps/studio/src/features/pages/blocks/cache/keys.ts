/**
 * @file apps/studio/src/features/pages/blocks/cache/keys.ts
 * @layer hooks/admin/pages/blocks
 *
 * @description
 * Helpers pour construire des query keys React Query liées aux blocks.
 *
 * @remarks
 * - Tenant-scoped : on préfixe par ["t", tenantId, ...]
 *   pour éviter les collisions de cache lors d'un switch tenant.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";

function normalizeTenantId(tenantId: string): string {
  return String(tenantId ?? "")
    .trim()
    .toLowerCase();
}

export function pageBlocksKey(
  tenantId: string,
  pageId: string,
  state: ContentState,
) {
  const t = normalizeTenantId(tenantId);
  const id = String(pageId ?? "").trim();

  return ["t", t, "admin", "pages", "blocks", "byId", id, state] as const;
}
