/**
 * @file apps/studio/src/app/api/settings/invalidate-settings-status.ts
 * @layer studio/app/api/settings
 * @description Best-effort Website status invalidation after a committed settings write.
 */

import type { MutationOutcome } from "@compoz/core/domain/revisions/mutation-outcome";
import type { SiteStatusCachePort } from "@compoz/core/domain/site/ports/site-status-cache-port";

type Logger = Readonly<{
  error?: (message: string, context: Readonly<Record<string, unknown>>) => void;
}>;

export async function invalidateUpdatedSettingsStatus(args: Readonly<{
  websiteId: string;
  outcome: MutationOutcome;
  statusCache: SiteStatusCachePort;
  logger: Logger;
}>): Promise<boolean> {
  if (args.outcome !== "updated") return true;

  try {
    const invalidated = await args.statusCache.invalidateStatus();
    if (!invalidated) {
      args.logger.error?.("route.settings.invalidate.failed", {
        websiteId: args.websiteId,
        invalidateStatus: true,
        failureKind: "returned-false",
      });
    }
    return invalidated;
  } catch (error) {
    args.logger.error?.("route.settings.invalidate.failed", {
      websiteId: args.websiteId,
      err: String(error),
      invalidateStatus: true,
      failureKind: "rejected",
    });
    return false;
  }
}
