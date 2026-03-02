/**
 * @file apps/studio/src/app/api/pages/[pageId]/blocks/reorder/route.ts
 * @layer api/routes
 * @description
 * Route API Admin (V0.5) — réordonne les blocks d’une page (draft-only).
 *
 * Responsabilités :
 * - POST : réordonne les blocks via le use-case `reorderBlocks` (draft-only).
 * - Validation du paramètre `pageId` (params) et du payload (Zod intent).
 * - Invalidation statusCache (KV snapshots) après mutation.
 */

import { readJsonOr400 } from "@compoz/infra/http/read-json";
import { log, logSpan } from "@compoz/infra/lib/log";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";

import { getPagesRepository } from "@compoz/infra/pages";
import { getSiteStatusCache } from "@compoz/infra/site";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { reorderBlocks } from "@compoz/core/domain/pages/use-cases/blocks/reorder-blocks";

import type { PageDTO } from "@compoz/core/domain/pages/dto";

import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { ReorderBlocksResponse } from "@compoz/infra/http/studio/pages.types";
import { ReorderBlocksIntentSchema } from "@compoz/validation/pages/blocks/block-intents";
import { PageIdParamSchema } from "@compoz/validation/pages/page";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";

export async function POST(req: Request, ctx: { params: unknown }) {
  const NS = "api.admin.pages.id.blocks.reorder.POST" as const;

  return handleRoute(NS, req, async () => {
    return logSpan(
      NS,
      { ns: NS, method: "POST", state: WRITE_CONTENT_STATE },
      async () => {
        const lg = log.child({ ns: NS });

        const params = await unwrapParams(ctx.params);

        const { pageId } = parseDTOOrHttp(PageIdParamSchema, params, {
          message: EC.INVALID_ARGUMENT,
          extras: { where: "api.admin.pages.id.blocks.reorder.POST.params" },
        });

        const body = await readJsonOr400(req);

        const dto = parseDTOOrHttp(ReorderBlocksIntentSchema, body, {
          message: EC.VALIDATION_ERROR,
          extras: { where: "api.admin.pages.id.blocks.reorder.POST.payload" },
        });

        const pagesRepo = getPagesRepository();
        const statusCache = getSiteStatusCache();

        const run = reorderBlocks({ pages: pagesRepo });
        const { page } = await run({
          pageId,
          orderedBlockIds: dto.orderedBlockIds,
        });

        // ✅ Invalidation KV snapshots (best-effort)
        try {
          lg.info?.("route.statusCache.invalidateAll.start", {});
          await statusCache.invalidateAll();
          lg.info?.("route.statusCache.invalidateAll.done", {});
        } catch (e) {
          lg.error?.("route.statusCache.invalidateAll.failed", {
            err: String(e),
          });
        }

        const res: ReorderBlocksResponse = { page: page as PageDTO };
        return res;
      },
    );
  });
}
