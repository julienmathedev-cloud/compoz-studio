/**
 * @file apps/studio/src/app/api/site/status/route.ts
 * @layer api/routes
 */

import { log, logSpan } from "@compoz/infra/lib/log";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";

import { getSiteStatus } from "@compoz/core/domain/site/use-cases/status/get-site-status";

import { getPagesRepository } from "@compoz/infra/pages";
import { getSiteRepository } from "@compoz/infra/site";

import type { GetSiteStatusResponse } from "@compoz/infra/http/studio/site.types";
import { KvSiteStatusSnapshot } from "@compoz/infra/site/kv-site-status-snapshot";

export async function GET(req: Request) {
  const NS = "api.admin.site.status.GET" as const;

  return handleRoute(NS, req, async () => {
    return logSpan(NS, { ns: NS, method: "GET" }, async () => {
      const pages = getPagesRepository();
      const site = getSiteRepository();
      const cache = new KvSiteStatusSnapshot();

      const run = getSiteStatus({ pages, site, cache });
      log.info?.("STATUS.GET.before", {
        tenant: process.env["COMPOZ_SITE_ID"] ?? "default",
      });
      const { status } = await run();

      const res: GetSiteStatusResponse = { status };

      log.info?.("STATUS.GET.after", {
        hasChanges: res.status?.hasChanges?.site,
        lastPublishedAt: res.status?.published?.lastPublishedAt ?? null,
      });
      return res;
    });
  });
}
