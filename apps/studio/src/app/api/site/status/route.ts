/**
 * @file apps/studio/src/app/api/site/status/route.ts
 * @layer studio/app/api
 * @description
 * Route API Studio pour récupérer le statut global du site.
 *
 * Responsabilités :
 * - GET : retourne l’état du site (draft vs published).
 * - Agrège les informations via le use-case `getSiteStatus`.
 * - Utilise le snapshot cache pour limiter les lectures KV.
 */

import "server-only";

import { log, logSpan } from "@compoz/infra/lib/log";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";

import { getSiteStatus } from "@compoz/core/domain/site/use-cases/status/get-site-status";

import { getPagesRepository } from "@compoz/infra/pages";
import { getSiteRepository, getSiteStatusCache } from "@compoz/infra/site";

import type { GetSiteStatusResponse } from "@compoz/infra/http/studio/site.types";

import { requireSessionWithTenant } from "@compoz/studio/auth/require-session";

export async function GET(req: Request) {
  const NS = "api.studio.site.status.GET" as const;

  return handleRoute(NS, req, async () => {
    const { tenantId } = await requireSessionWithTenant();

    return logSpan(NS, { ns: NS, method: "GET", tenantId }, async () => {
      const lg = log.child({ ns: NS });

      const pages = getPagesRepository({ tenantId });
      const site = getSiteRepository({ tenantId });
      const cache = getSiteStatusCache({ tenantId });

      const run = getSiteStatus({ pages, site, cache });

      lg.info?.("route.status.get.start", { tenantId });

      const { status } = await run();

      const res: GetSiteStatusResponse = { status };

      lg.info?.("route.status.get.done", {
        tenantId,
        hasChanges: res.status?.hasChanges?.site,
        lastPublishedAt: res.status?.published?.lastPublishedAt ?? null,
      });

      return res;
    });
  });
}
