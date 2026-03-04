/**
 * @file apps/studio/src/features/site-index/keys.ts
 * @layer hooks/admin/site
 *
 * @description
 * Helpers pour construire des query keys React Query liées aux sites.
 *
 * @remarks
 * - Tenant-scoped : la key inclut tenantId pour éviter le cache cross-tenant.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";

function normalizeTenantId(tenantId: unknown): string {
  return String(tenantId ?? "")
    .trim()
    .toLowerCase();
}

export function siteIndexKey(tenantId: string, state: ContentState) {
  const tid = normalizeTenantId(tenantId);
  return ["t", tid, "admin", "siteIndex", state] as const;
}
