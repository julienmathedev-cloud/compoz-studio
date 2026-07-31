/**
 * @file apps/studio/src/features/pages/hooks/invalidate-page-mutation-status-views.ts
 * @layer studio/features/pages/hooks
 * @description Invalidates React Query status views only after a committed page write.
 */

import type { QueryClient } from "@tanstack/react-query";

import type { MutationOutcome } from "@compoz/core/domain/revisions/mutation-outcome";
import { invalidateAllSiteStatusViews } from "@compoz/studio/features/site/status/invalidate";

export function invalidatePageMutationStatusViews(args: Readonly<{
  queryClient: QueryClient;
  websiteId: string;
  outcome: MutationOutcome;
}>): Promise<unknown> {
  if (args.outcome !== "updated") return Promise.resolve();

  return invalidateAllSiteStatusViews(args.queryClient, args.websiteId);
}

invalidatePageMutationStatusViews.displayName = "invalidatePageMutationStatusViews";
