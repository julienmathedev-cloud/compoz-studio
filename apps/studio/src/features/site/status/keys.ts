/**
 * @file apps/studio/src/features/site/status/keys.ts
 * @layer hooks/studio/site/status
 *
 * @description
 * Query keys tenant-scoped pour le statut du site.
 */

import type { SiteStatusDetailsScopeDTO } from "@compoz/core/domain/site/dto";

import { toTenantId } from "@compoz/ui/lib/tenant-id";

/** Key SoT (tenant-scoped) */
export function siteStatusKey(tenantId: string) {
  const tid = toTenantId(tenantId);
  return ["t", tid, "studio", "site", "status"] as const;
}

/** Key prefix SoT (tenant-scoped) */
export function siteStatusDetailsPrefix(tenantId: string) {
  const tid = toTenantId(tenantId);
  return ["t", tid, "studio", "site", "statusDetails"] as const;
}

export function siteStatusDetailsKey(args: {
  tenantId: string;
  scope: SiteStatusDetailsScopeDTO;
  includeBlocks: boolean;
  pageId?: string | null;
}) {
  const tid = toTenantId(args.tenantId);
  const pageId = (args.pageId ?? "").trim();

  return [
    "t",
    tid,
    "studio",
    "site",
    "statusDetails",
    args.scope,
    args.includeBlocks,
    pageId ? pageId : null,
  ] as const;
}

siteStatusKey.displayName = "siteStatusKey";
siteStatusDetailsPrefix.displayName = "siteStatusDetailsPrefix";
siteStatusDetailsKey.displayName = "siteStatusDetailsKey";
