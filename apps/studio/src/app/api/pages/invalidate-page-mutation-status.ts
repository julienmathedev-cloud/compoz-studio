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

export async function invalidateUpdatedPageStatus(args: Readonly<{
  websiteId: string;
  outcome: MutationOutcome;
  statusCache: SiteStatusCachePort;
  logger: Logger;
}>): Promise<void> {
  if (args.outcome !== "updated") return;

  try {
    await Promise.all([
      args.statusCache.invalidateStatus(),
      args.statusCache.invalidateStatusDetails(),
    ]);
  } catch (error) {
    args.logger.error?.("route.statusCache.invalidate.failed", {
      websiteId: args.websiteId,
      err: String(error),
      invalidateStatus: true,
      invalidateStatusDetails: true,
    });
  }
}
