/**
 * @file apps/studio/src/app/api/pages/invalidate-page-mutation-status.ts
 * @layer studio/app/api/pages
 * @description Best-effort status invalidation after a committed page mutation write.
 */

import type { MutationOutcome } from "@compoz/core/domain/revisions/mutation-outcome";
import type { SiteStatusCachePort } from "@compoz/core/domain/site/ports/site-status-cache-port";

type Logger = Readonly<{
  error?: (message: string, context: Readonly<Record<string, unknown>>) => void;
}>;

/**
 * Invalidates snapshots after a committed page mutation. Redis is best-effort:
 * a false/rejected invalidation is logged and never rejects the mutation flow.
 */
export async function invalidateCommittedPageStatus(args: Readonly<{
  websiteId: string;
  statusCache: Pick<SiteStatusCachePort, "invalidateAll">;
  logger: Logger;
}>): Promise<boolean> {
  try {
    const invalidated = await args.statusCache.invalidateAll();

    if (!invalidated) {
      args.logger.error?.("route.statusCache.invalidate.failed", {
        websiteId: args.websiteId,
        invalidateStatus: true,
        invalidateStatusDetails: true,
        failureKind: "returned-false",
      });
    }

    return invalidated;
  } catch (error) {
    args.logger.error?.("route.statusCache.invalidate.failed", {
      websiteId: args.websiteId,
      err: String(error),
      invalidateStatus: true,
      invalidateStatusDetails: true,
      failureKind: "rejected",
    });
    return false;
  }
}

/** Returns true for noChanges because no invalidation was required. */
export async function invalidateUpdatedPageStatus(args: Readonly<{
  websiteId: string;
  outcome: MutationOutcome;
  statusCache: Pick<SiteStatusCachePort, "invalidateAll">;
  logger: Logger;
}>): Promise<boolean> {
  if (args.outcome !== "updated") return true;

  return invalidateCommittedPageStatus(args);
}
