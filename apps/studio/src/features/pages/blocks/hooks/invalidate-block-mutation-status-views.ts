/**
 * @file apps/studio/src/features/pages/blocks/hooks/invalidate-block-mutation-status-views.ts
 * @layer studio/features/pages/blocks/hooks
 * @description Invalidates React Query status views only after a committed block write.
 */

import type { QueryClient } from "@tanstack/react-query";

import type { MutationOutcome } from "@compoz/core/domain/revisions/mutation-outcome";
import { invalidateAllSiteStatusViews } from "@compoz/studio/features/site/status/invalidate";

export function invalidateBlockMutationStatusViews(args: Readonly<{
  queryClient: QueryClient;
  websiteId: string;
  outcome: MutationOutcome;
}>): Promise<unknown> {
  if (args.outcome !== "updated") return Promise.resolve();

  return invalidateAllSiteStatusViews(args.queryClient, args.websiteId);
}
