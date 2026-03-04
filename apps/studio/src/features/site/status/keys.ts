/**
 * @file apps/studio/src/features/site/status/keys.ts
 * @layer hooks/admin/site/status
 *
 * @description
 * Query keys tenant-scoped pour le statut du site.
 */

import type { SiteStatusDetailsScopeDTO } from "@compoz/core/domain/site/dto";

function normalizeTenantId(tenantId: string) {
  return String(tenantId ?? "")
    .trim()
    .toLowerCase();
}

/** Key SoT (tenant-scoped) */
export function siteStatusKey(tenantId: string) {
  const tid = normalizeTenantId(tenantId);
  return ["t", tid, "admin", "site", "status"] as const;
}

/** Key prefix SoT (tenant-scoped) */
export function siteStatusDetailsPrefix(tenantId: string) {
  const tid = normalizeTenantId(tenantId);
  return ["t", tid, "admin", "site", "statusDetails"] as const;
}

export function siteStatusDetailsKey(args: {
  tenantId: string;
  scope: SiteStatusDetailsScopeDTO;
  includeBlocks: boolean;
  pageId?: string | null;
}) {
  const tid = normalizeTenantId(args.tenantId);
  const pageId = (args.pageId ?? "").trim();

  return [
    "t",
    tid,
    "admin",
    "site",
    "statusDetails",
    args.scope,
    args.includeBlocks,
    pageId ? pageId : null,
  ] as const;
}
