/**
 * @file apps/studio/src/app/api/pages/[pageId]/children/reorder/invalidate-reorder-status.ts
 * @layer studio/app/api
 * @description Best-effort status invalidation after a committed page reorder.
 */

import type { SiteStatusCachePort } from "@compoz/core/domain/site/ports/site-status-cache-port";
import type { MutationOutcome } from "@compoz/core/domain/revisions/mutation-outcome";
import { invalidateUpdatedPageStatus } from "@compoz/studio/app/api/pages/invalidate-page-mutation-status";

type Logger = Readonly<{
  error?: (message: string, context: Readonly<Record<string, unknown>>) => void;
}>;

export async function invalidateCommittedReorderStatus<TResult extends Readonly<{ outcome: MutationOutcome }>>(args: {
  websiteId: string;
  statusCache: SiteStatusCachePort;
  logger: Logger;
  commit: () => Promise<TResult>;
}): Promise<TResult> {
  const result = await args.commit();

  await invalidateUpdatedPageStatus({
    websiteId: args.websiteId,
    outcome: result.outcome,
    statusCache: args.statusCache,
    logger: args.logger,
  });
  return result;
}
