/**
 * @file apps/studio/src/app/api/site/publish/invalidate-publish-status-cache.ts
 * @layer studio/app/api
 * @description Post-commit status-cache invalidation for the publish route.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import type { SiteStatusCachePort } from "@compoz/core/domain/site/ports/site-status-cache-port";
import type { PublishSiteResult } from "@compoz/core/domain/site/use-cases/publish/publish-site.types";
import type { Logger } from "@compoz/infra/lib/log";

type InvalidatePublishStatusCacheParams = Readonly<{
  websiteId: string;
  publish: PublishOperation;
  statusCache: Pick<SiteStatusCachePort, "invalidateAll">;
  logger: Pick<Logger, "debug" | "error">;
}>;

type PublishOperation = () => Promise<PublishSiteResult>;

export type PublishWithStatusCacheInvalidationResult = Readonly<{
  result: PublishSiteResult;
  cacheInvalidated: boolean;
}>;

export async function publishAndInvalidateStatusCache({
  websiteId,
  publish,
  statusCache,
  logger,
}: InvalidatePublishStatusCacheParams): Promise<PublishWithStatusCacheInvalidationResult> {
  const committedResult = await publish();
  let cacheInvalidated = false;

  try {
    logger.debug("route.statusCache.invalidateAll.start", { websiteId });

    cacheInvalidated = await statusCache.invalidateAll();

    logger.debug("route.statusCache.invalidateAll.done", {
      websiteId,
      cacheInvalidated,
    });
  } catch {
    logger.error("route.statusCache.invalidateAll.failed", {
      websiteId,
    });
  }

  if (cacheInvalidated) {
    return { result: committedResult, cacheInvalidated };
  }

  return {
    result: {
      ...committedResult,
      warnings: [
        ...committedResult.warnings,
        {
          code: ERROR_CODES.PUBLISH_STATUS_CACHE_INVALIDATION_FAILED,
          path: ["studio", "statusCache"],
        },
      ],
    },
    cacheInvalidated,
  };
}
