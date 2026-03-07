/**
 * @file apps/studio/src/features/pages/blocks/cache/keys.ts
 * @layer hooks/studio/pages/blocks
 *
 * @description
 * Helpers pour construire des query keys React Query liées aux blocks.
 *
 * @remarks
 * - Tenant-scoped : on préfixe par ["t", tenantId, ...]
 *   pour éviter les collisions de cache lors d'un switch tenant.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { toTenantId } from "@compoz/ui/lib/tenant-id";

export function pageBlocksKey(
  tenantId: string,
  pageId: string,
  state: ContentState,
) {
  const t = toTenantId(tenantId);
  const pageIdKey = String(pageId ?? "").trim();

  return [
    "t",
    t,
    "studio",
    "pages",
    "blocks",
    "byId",
    pageIdKey,
    state,
  ] as const;
}
