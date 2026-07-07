/**
 * @file apps/studio/src/app/api/site/status/route.ts
 * @layer studio/app/api
 *
 * @description
 * Studio API route for retrieving the active Website global status.
 *
 * @remarks
 * - Aggregates data through the `getSiteStatus` use case.
 * - Uses the snapshot cache to reduce repository reads.
 * - Repositories and cache are scoped by Prisma Website.id.
 */

import "server-only";

import { getSiteStatus } from "@compoz/core/domain/site/use-cases/status/get-site-status";
import type { GetSiteStatusResponse } from "@compoz/infra/http/studio/site.types";
import { log, logSpan } from "@compoz/infra/lib/log";
import { getPagesRepository } from "@compoz/infra/pages";
import { getSiteRepository, getSiteStatusCache } from "@compoz/infra/site";
import { requireSessionWithWebsite } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";

export async function GET(req: Request) {
  const NS = "api.studio.site.status.GET" as const;

  return handleRoute(NS, req, async () => {
    const { websiteId } = await requireSessionWithWebsite();

    return logSpan(NS, { ns: NS, method: "GET", websiteId }, async () => {
      const logger = log.child({ ns: NS });

      const pages = getPagesRepository({ websiteId });
      const site = getSiteRepository({ websiteId });
      const cache = getSiteStatusCache({ websiteId });

      const run = getSiteStatus({ pages, site, cache });

      logger.debug?.("route.status.get.start", {
        websiteId,
      });

      const { status } = await run();

      const res: GetSiteStatusResponse = {
        status,
      };

      logger.debug?.("route.status.get.done", {
        websiteId,
        hasChanges: res.status?.hasChanges?.site,
        lastPublishedAt: res.status?.published?.lastPublishedAt ?? null,
      });

      return res;
    });
  });
}
