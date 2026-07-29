/**
 * @file apps/studio/src/app/api/pages/[pageId]/children/reorder/invalidate-reorder-status.ts
 * @layer studio/app/api
 * @description Best-effort status invalidation after a committed page reorder.
 */

import type { SiteStatusCachePort } from "@compoz/core/domain/site/ports/site-status-cache-port";

type Logger = Readonly<{
  error?: (message: string, context: Readonly<Record<string, unknown>>) => void;
}>;

export async function invalidateCommittedReorderStatus<TResult>(args: {
  websiteId: string;
  statusCache: SiteStatusCachePort;
  logger: Logger;
  commit: () => Promise<TResult>;
}): Promise<TResult> {
  const result = await args.commit();

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
  return result;
}
