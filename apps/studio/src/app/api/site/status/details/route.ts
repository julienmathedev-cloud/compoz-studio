/**
 * @file apps/studio/src/app/api/site/status/details/route.ts
 * @layer studio/app/api
 * @description
 * Route API Studio — status details (diff pages/blocks draft vs published).
 *
 * Query :
 * - scope=dirty|all (default: dirty)
 * - includeBlocks=0|1|true|false (default: false)
 * - pageId=<id> (optional)
 */

import "server-only";

import { logSpan } from "@compoz/infra/lib/log";
import { getPagesRepository } from "@compoz/infra/pages";
import { getSiteRepository, getSiteStatusCache } from "@compoz/infra/site";

import type { SiteStatusDetailsScope } from "@compoz/core/domain/site/entities/site-status-details";
import { getSiteStatusDetails } from "@compoz/core/domain/site/use-cases/status/get-site-status-details";

import type { GetSiteStatusDetailsResponse } from "@compoz/infra/http/studio/site.types";

import { requireSessionWithTenant } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";

type ParsedQuery = Readonly<{
  scope: SiteStatusDetailsScope;
  includeBlocks: boolean;
  pageId: string | null;
}>;

function parseQueryFromUrl(url: string): ParsedQuery {
  try {
    const u = new URL(url);

    const scopeRaw = (u.searchParams.get("scope") ?? "dirty").trim();
    const scope: SiteStatusDetailsScope = scopeRaw === "all" ? "all" : "dirty";

    const includeRaw = (u.searchParams.get("includeBlocks") ?? "0").trim();
    const includeBlocks =
      includeRaw === "1" || includeRaw.toLowerCase() === "true";

    const pageIdRaw = (u.searchParams.get("pageId") ?? "").trim();
    const pageId = pageIdRaw || null;

    return { scope, includeBlocks, pageId } as const;
  } catch {
    return { scope: "dirty", includeBlocks: false, pageId: null } as const;
  }
}

export async function GET(req: Request) {
  const NS = "api.studio.site.status.details.GET" as const;

  return handleRoute(NS, req, async () => {
    const { tenantId } = await requireSessionWithTenant();

    return logSpan(NS, { ns: NS, method: "GET", tenantId }, async () => {
      const { scope, includeBlocks, pageId } = parseQueryFromUrl(req.url);

      const pages = getPagesRepository({ tenantId });
      const site = getSiteRepository({ tenantId });
      const cache = getSiteStatusCache({ tenantId });

      const run = getSiteStatusDetails({ pages, site, cache });
      const { details } = await run({ scope, includeBlocks, pageId });

      const res: GetSiteStatusDetailsResponse = { details };
      return res;
    });
  });
}
