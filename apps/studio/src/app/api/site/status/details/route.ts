/**
 * @file apps/studio/src/app/api/site/status/details/route.ts
 * @layer studio/app/api
 *
 * @description
 * Studio API route for detailed active Website status between draft and published.
 *
 * @remarks
 * - Returns page/block differences between draft and published.
 * - Uses the snapshot cache to reduce repository reads.
 * - Repositories and cache are scoped by Prisma Website.id.
 */

import "server-only";

import type { SiteStatusDetailsScope } from "@compoz/core/domain/site/entities/site-status-details";
import { getSiteStatusDetails } from "@compoz/core/domain/site/use-cases/status/get-site-status-details";
import type { GetSiteStatusDetailsResponse } from "@compoz/infra/http/studio/site.types";
import { logSpan } from "@compoz/infra/lib/log";
import { getPagesRepository } from "@compoz/infra/pages";
import { getSiteRepository, getSiteStatusCache } from "@compoz/infra/site";
import { requireSessionWithWebsite } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";

type ParsedQuery = Readonly<{
  scope: SiteStatusDetailsScope;
  includeBlocks: boolean;
  pageId: string | null;
}>;

function parseQueryFromUrl(url: string): ParsedQuery {
  try {
    const parsedUrl = new URL(url);

    const scopeRaw = (parsedUrl.searchParams.get("scope") ?? "dirty").trim();

    const scope: SiteStatusDetailsScope = scopeRaw === "all" ? "all" : "dirty";

    const includeRaw = (
      parsedUrl.searchParams.get("includeBlocks") ?? "0"
    ).trim();

    const includeBlocks =
      includeRaw === "1" || includeRaw.toLowerCase() === "true";

    const pageIdRaw = (parsedUrl.searchParams.get("pageId") ?? "").trim();

    const pageId = pageIdRaw || null;

    return {
      scope,
      includeBlocks,
      pageId,
    };
  } catch {
    return {
      scope: "dirty",
      includeBlocks: false,
      pageId: null,
    };
  }
}

export async function GET(req: Request) {
  const NS = "api.studio.site.status.details.GET" as const;

  return handleRoute(NS, req, async () => {
    const { websiteId } = await requireSessionWithWebsite();

    return logSpan(NS, { ns: NS, method: "GET", websiteId }, async () => {
      const { scope, includeBlocks, pageId } = parseQueryFromUrl(req.url);

      const pages = getPagesRepository({ websiteId });
      const site = getSiteRepository({ websiteId });
      const cache = getSiteStatusCache({ websiteId });

      const run = getSiteStatusDetails({
        pages,
        site,
        cache,
      });

      const { details } = await run({
        scope,
        includeBlocks,
        pageId,
      });

      const res: GetSiteStatusDetailsResponse = {
        details,
      };

      return res;
    });
  });
}
