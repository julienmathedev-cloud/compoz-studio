/**
 * @file apps/studio/src/app/api/site/status/details/route.ts
 * @layer api/routes
 */

import { NextResponse } from "next/server";

import { logSpan } from "@compoz/infra/lib/log";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";

import type { SiteStatusDetailsScope } from "@compoz/core/domain/site/entities/site-status-details";

import { getPagesRepository } from "@compoz/infra/pages";
import { getSiteStatusCache } from "@compoz/infra/site";

import { getSiteStatusDetails } from "@compoz/core/domain/site/use-cases/status/get-site-status-details";
import type { GetSiteStatusDetailsResponse } from "@compoz/infra/http/studio/site.types";
import { requireSessionWithTenant } from "@compoz/studio/auth/require-session";

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
  const { tenantId } = await requireSessionWithTenant();
  if (!tenantId) {
    return NextResponse.json({ error: "Missing tenant" }, { status: 400 });
  }

  const NS = "api.admin.site.status.details.GET" as const;

  return handleRoute(NS, req, async () => {
    return logSpan(NS, { ns: NS, method: "GET" }, async () => {
      const { scope, includeBlocks, pageId } = parseQueryFromUrl(req.url);

      const pages = getPagesRepository({ tenantId });
      const cache = getSiteStatusCache({ tenantId });

      const run = getSiteStatusDetails({ pages, cache });
      const { details } = await run({ scope, includeBlocks, pageId });

      const res: GetSiteStatusDetailsResponse = { details };
      return res;
    });
  });
}
