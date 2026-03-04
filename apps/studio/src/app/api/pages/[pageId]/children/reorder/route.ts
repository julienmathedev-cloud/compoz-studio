/**
 * @file apps/studio/src/app/api/pages/[pageId]/children/reorder/route.ts
 * @layer api/routes
 * @description
 * Route Admin: reorder des enfants d’un parent (index-only, draft).
 *
 * POST: body = { childIds: string[] }
 * - Réordonne uniquement les pages dont parentId === parentId
 * - Écrit l’index (SoT)
 */

import { readJsonOr400 } from "@compoz/infra/http/read-json";
import { log, logSpan } from "@compoz/infra/lib/log";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";

import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { reorderPageChildren } from "@compoz/core/domain/pages/use-cases/reorder-page-children";
import type { ReorderChildrenResponse } from "@compoz/infra/http/studio/pages.types";

import { getSiteRepository, getSiteStatusCache } from "@compoz/infra/site";

import { unwrapParams } from "@compoz/studio/lib/unwrap-params";
import { PageIdParamSchema } from "@compoz/validation/pages/page";
import {
  ReorderChildrenIntentSchema,
  type ReorderChildrenIntentDTO,
} from "@compoz/validation/pages/page-intents";

import { requireSessionWithTenant } from "@compoz/studio/auth/require-session";

export async function POST(req: Request, ctx: { params: unknown }) {
  const NS = "api.admin.pages.children.reorder.POST" as const;

  return handleRoute(NS, req, async () => {
    const { tenantId } = await requireSessionWithTenant();

    return logSpan(
      NS,
      { ns: NS, method: "POST", state: WRITE_CONTENT_STATE, tenantId },
      async () => {
        const lg = log.child({ ns: NS });

        const params = await unwrapParams(ctx.params);

        const { pageId } = parseDTOOrHttp(PageIdParamSchema, params, {
          message: EC.INVALID_ARGUMENT,
          extras: { where: "api.admin.pages.children.reorder.params" },
        });

        const body = await readJsonOr400(req);

        const dto: ReorderChildrenIntentDTO = parseDTOOrHttp(
          ReorderChildrenIntentSchema,
          body,
          {
            message: EC.VALIDATION_ERROR,
            extras: { where: "api.admin.pages.children.reorder.payload" },
          },
        );

        const siteRepo = getSiteRepository({ tenantId });
        const statusCache = getSiteStatusCache({ tenantId });

        // domain pur (pas de statusCache)
        const run = reorderPageChildren({
          site: siteRepo,
        });

        const { index } = await run({
          parentId: pageId,
          childIds: dto.childIds,
        });

        lg.debug("route.children.reordered", {
          tenantId,
          pageId,
          count: dto.childIds.length,
        });

        // ✅ Invalidation KV (best-effort)
        try {
          lg.info?.("route.statusCache.invalidateAll.start", {});
          await statusCache.invalidateAll();
          lg.info?.("route.statusCache.invalidateAll.done", {});
        } catch (e) {
          lg.error?.("route.statusCache.invalidateAll.failed", {
            err: String(e),
          });
        }

        const res: ReorderChildrenResponse = { index };
        return res;
      },
    );
  });
}
