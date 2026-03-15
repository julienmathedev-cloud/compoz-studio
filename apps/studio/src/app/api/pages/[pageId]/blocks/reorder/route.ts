/**
 * @file apps/studio/src/app/api/pages/[pageId]/blocks/reorder/route.ts
 * @layer studio/app/api
 * @description
 * Route API Studio — réordonne les blocks d’une page (draft-only).
 */

import "server-only";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";

import type { PageDTO } from "@compoz/core/domain/pages/dto";

import { reorderBlocks } from "@compoz/core/domain/pages/use-cases/blocks/reorder-blocks";

import { readJsonOr400 } from "@compoz/infra/http/read-json";

import type { ReorderBlocksResponse } from "@compoz/infra/http/studio/pages.types";

import { log, logSpan } from "@compoz/infra/lib/log";

import { getPagesRepository } from "@compoz/infra/pages";
import { getSiteStatusCache } from "@compoz/infra/site";

import { adaptReorderBlocksIntent } from "@compoz/studio/app/api/_adapters/pages/blocks/blocks";

import { requireSessionWithTenant } from "@compoz/studio/auth/require-session";

import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";

import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";

import {
  ReorderBlocksIntentSchema,
  type ReorderBlocksIntentDTO,
} from "@compoz/validation/pages/blocks/block-intents";

import { PageIdParamSchema } from "@compoz/validation/pages/page";

export async function POST(req: Request, ctx: { params: unknown }) {
  const NS = "api.studio.pages.id.blocks.reorder.POST" as const;

  return handleRoute(NS, req, async () => {
    const { tenantId } = await requireSessionWithTenant();

    return logSpan(
      NS,
      { ns: NS, method: "POST", state: DEFAULT_CONTENT_STATE, tenantId },
      async () => {
        const lg = log.child({ ns: NS });

        const params = await unwrapParams(ctx.params);

        const { pageId } = parseDTOOrHttp(PageIdParamSchema, params, {
          message: EC.INVALID_ARGUMENT,
          extras: {
            where: "api.studio.pages.id.blocks.reorder.POST.params",
          },
        });

        const body = await readJsonOr400(req);

        const dto: ReorderBlocksIntentDTO = parseDTOOrHttp(
          ReorderBlocksIntentSchema,
          body,
          {
            message: EC.VALIDATION_ERROR,
            extras: {
              where: "api.studio.pages.id.blocks.reorder.POST.payload",
            },
          },
        );

        const adapted = adaptReorderBlocksIntent(dto);

        const pagesRepo = getPagesRepository({ tenantId });
        const statusCache = getSiteStatusCache({ tenantId });

        const run = reorderBlocks({
          pages: pagesRepo,
        });

        const { page } = await run({
          pageId,
          ...adapted,
        });

        try {
          lg.info?.("route.statusCache.invalidate.start", {});

          await Promise.all([
            statusCache.invalidateStatus(),
            statusCache.invalidateStatusDetails(),
          ]);

          lg.info?.("route.statusCache.invalidate.done", {});
        } catch (e) {
          lg.error?.("route.statusCache.invalidate.failed", {
            err: String(e),
          });
        }

        const res: ReorderBlocksResponse = {
          page: page as PageDTO,
        };

        return res;
      },
    );
  });
}
