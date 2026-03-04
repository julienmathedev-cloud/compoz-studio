/**
 * @file apps/studio/src/app/api/site/status/route.ts
 * @layer api/routes
 */

import { log, logSpan } from "@compoz/infra/lib/log";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";

import { getSiteStatus } from "@compoz/core/domain/site/use-cases/status/get-site-status";

import { getPagesRepository } from "@compoz/infra/pages";
import { getSiteRepository, getSiteStatusCache } from "@compoz/infra/site";

import type { GetSiteStatusResponse } from "@compoz/infra/http/studio/site.types";

import { requireSessionWithTenant } from "@compoz/studio/auth/require-session";

export async function GET(req: Request) {
  const NS = "api.admin.site.status.GET" as const;

  return handleRoute(NS, req, async () => {
    const { tenantId } = await requireSessionWithTenant();

    return logSpan(NS, { ns: NS, method: "GET", tenantId }, async () => {
      const pages = getPagesRepository({ tenantId });
      const site = getSiteRepository({ tenantId });
      const cache = getSiteStatusCache({ tenantId });

      const run = getSiteStatus({ pages, site, cache });

      log.info?.("STATUS.GET.before", { tenantId });

      const { status } = await run();

      const res: GetSiteStatusResponse = { status };

      log.info?.("STATUS.GET.after", {
        tenantId,
        hasChanges: res.status?.hasChanges?.site,
        lastPublishedAt: res.status?.published?.lastPublishedAt ?? null,
      });

      return res;
    });
  });
}
