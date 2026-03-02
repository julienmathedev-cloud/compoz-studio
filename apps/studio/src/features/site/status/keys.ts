/**
 * @file apps/studio/src/features/site/status/keys.ts
 * @layer hooks/admin/site/status
 *
 * @description
 * Helper pour construire une key React Query liée au statut du site.
 */

import type { SiteStatusDetailsScopeDTO } from "@compoz/core/domain/site/dto";

export function siteStatusDetailsKey(args: {
  scope: SiteStatusDetailsScopeDTO;
  includeBlocks: boolean;
  pageId?: string | null;
}) {
  const pageId = (args.pageId ?? "").trim();
  return [
    "admin",
    "site",
    "statusDetails",
    args.scope,
    args.includeBlocks,
    pageId ? pageId : null,
  ] as const;
}
