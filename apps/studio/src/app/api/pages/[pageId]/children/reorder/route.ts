/**
 * @file apps/studio/src/app/api/pages/[pageId]/children/reorder/route.ts
 * @layer studio/app/api
 *
 * @description
 * Studio API route for reordering child pages in the draft page index.
 *
 * @remarks
 * - Reorders only pages whose `parentId` matches the route `pageId`.
 * - Writes the draft index, which is the Studio source of truth for page hierarchy.
 * - Invalidates Website-scoped status snapshots because order is publishable state.
 * - The repository is scoped by Prisma Website.id.
 */

import "server-only";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { reorderPageChildren } from "@compoz/core/domain/pages/use-cases/reorder-page-children";
import { readJsonOr400 } from "@compoz/infra/http/read-json";
import type { ReorderChildrenResponse } from "@compoz/infra/http/studio/pages.types";
import { log, logSpan } from "@compoz/infra/lib/log";
import { getSiteRepository, getSiteStatusCache } from "@compoz/infra/site";
import { requireSessionWithWebsite } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import { PageIdParamSchema } from "@compoz/validation/pages/page";
import {
  ReorderChildrenIntentSchema,
  type ReorderChildrenIntentDTO,
} from "@compoz/validation/pages/page-intents";

export async function POST(req: Request, ctx: { params: unknown }) {
  const NS = "api.studio.pages.children.reorder.POST" as const;

  return handleRoute(NS, req, async () => {
    const { websiteId } = await requireSessionWithWebsite();

    return logSpan(
      NS,
      { ns: NS, method: "POST", state: DEFAULT_CONTENT_STATE, websiteId },
      async () => {
        const logger = log.child({ ns: NS });

        const params = await unwrapParams(ctx.params);

        const { pageId } = parseDTOOrHttp(PageIdParamSchema, params, {
          message: EC.INVALID_ARGUMENT,
          extras: { where: "api.studio.pages.children.reorder.params" },
        });

        const body = await readJsonOr400(req);

        const dto: ReorderChildrenIntentDTO = parseDTOOrHttp(
          ReorderChildrenIntentSchema,
          body,
          {
            message: EC.VALIDATION_ERROR,
            extras: { where: "api.studio.pages.children.reorder.payload" },
          },
        );

        const siteRepo = getSiteRepository({ websiteId });
        const statusCache = getSiteStatusCache({ websiteId });

        const run = reorderPageChildren({
          site: siteRepo,
        });

        const { index } = await run({
          parentId: pageId,
          childIds: dto.childIds,
        });

        await Promise.all([
          statusCache.invalidateStatus(),
          statusCache.invalidateStatusDetails(),
        ]);

        logger.debug("route.children.reordered", {
          websiteId,
          pageId,
          count: dto.childIds.length,
        });

        const res: ReorderChildrenResponse = { index };

        return res;
      },
    );
  });
}
