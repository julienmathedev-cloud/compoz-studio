/**
 * @file apps/studio/src/app/api/pages/[pageId]/blocks/[blockId]/route.ts
 * @layer studio/app/api
 * @description
 * Route API Studio — ressource block d’une page.
 *
 * Responsabilités :
 * - PATCH  : met à jour un block Section
 * - DELETE : supprime un block
 * - Validation params + payload
 * - Appel des use-cases domaine
 * - Invalidation statusCache KV
 */

import "server-only";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import type { PageDTO } from "@compoz/core/domain/pages/dto";

import { deleteBlock } from "@compoz/core/domain/pages/use-cases/blocks/delete-block";
import { updateSectionBlock } from "@compoz/core/domain/pages/use-cases/blocks/update-section-block";

import { throwHttp } from "@compoz/http/http-error";

import { readJsonOr400 } from "@compoz/infra/http/read-json";
import type {
  DeleteBlockResponse,
  UpdateSectionBlockResponse,
} from "@compoz/infra/http/studio/pages.types";

import { log, logSpan } from "@compoz/infra/lib/log";

import { getPagesRepository } from "@compoz/infra/pages";
import { getSiteStatusCache } from "@compoz/infra/site";

import { adaptUpdateSectionBlockIntent } from "@compoz/studio/app/api/_adapters/pages/blocks/blocks";

import { requireSessionWithTenant } from "@compoz/studio/auth/require-session";

import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";

import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";

import {
  UpdateSectionBlockIntentSchema,
  type UpdateSectionBlockIntentDTO,
} from "@compoz/validation/pages/blocks/block-intents";

import { PageIdAndBlockIdParamSchema } from "@compoz/validation/routes/params";

/* -------------------------------------------------------------------------- */
/* PATCH                                                                      */
/* -------------------------------------------------------------------------- */

export async function PATCH(req: Request, ctx: { params: unknown }) {
  const NS = "api.studio.pages.id.blocks.blockId.PATCH" as const;

  return handleRoute(NS, req, async ({ state }) => {
    const { tenantId } = await requireSessionWithTenant();

    return logSpan(
      NS,
      { ns: NS, method: "PATCH", state, tenantId },
      async () => {
        const lg = log.child({ ns: NS });

        const params = await unwrapParams(ctx.params);

        const { pageId, blockId: paramBlockId } = parseDTOOrHttp(
          PageIdAndBlockIdParamSchema,
          params,
          {
            message: EC.INVALID_ARGUMENT,
            extras: {
              where: "api.studio.pages.id.blocks.blockId.PATCH.params",
            },
          },
        );

        const body = await readJsonOr400(req);

        const dto: UpdateSectionBlockIntentDTO = parseDTOOrHttp(
          UpdateSectionBlockIntentSchema,
          body,
          {
            message: EC.VALIDATION_ERROR,
            extras: {
              where: "api.studio.pages.id.blocks.blockId.PATCH.payload",
            },
          },
        );

        if ("blockId" in dto && dto.blockId !== paramBlockId) {
          throwHttp(400, {
            code: EC.INVALID_ARGUMENT,
            message: EC.BLOCK_ID_MISMATCH,
            details: {
              path: ["blockId"],
              meta: { paramBlockId, bodyBlockId: dto.blockId },
            },
          });
        }

        const pagesRepo = getPagesRepository({ tenantId });
        const statusCache = getSiteStatusCache({ tenantId });

        const runUpdate = updateSectionBlock({
          pages: pagesRepo,
        });

        const adapted = adaptUpdateSectionBlockIntent(dto);

        const { page } = await runUpdate({
          pageId,
          blockId: paramBlockId,
          patch: adapted.patch,
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

        const res: UpdateSectionBlockResponse = {
          page: page as PageDTO,
        };

        return res;
      },
    );
  });
}

/* -------------------------------------------------------------------------- */
/* DELETE                                                                     */
/* -------------------------------------------------------------------------- */

export async function DELETE(req: Request, ctx: { params: unknown }) {
  const NS = "api.studio.pages.id.blocks.blockId.DELETE" as const;

  return handleRoute(NS, req, async ({ state }) => {
    const { tenantId } = await requireSessionWithTenant();

    return logSpan(
      NS,
      { ns: NS, method: "DELETE", state, tenantId },
      async () => {
        const lg = log.child({ ns: NS });

        const params = await unwrapParams(ctx.params);

        const { pageId, blockId: paramBlockId } = parseDTOOrHttp(
          PageIdAndBlockIdParamSchema,
          params,
          {
            message: EC.INVALID_ARGUMENT,
            extras: {
              where: "api.studio.pages.id.blocks.blockId.DELETE.params",
            },
          },
        );

        const pagesRepo = getPagesRepository({ tenantId });
        const statusCache = getSiteStatusCache({ tenantId });

        const runDelete = deleteBlock({
          pages: pagesRepo,
        });

        const { page } = await runDelete({
          pageId,
          blockId: paramBlockId,
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

        const res: DeleteBlockResponse = {
          page: page as PageDTO,
        };

        return res;
      },
    );
  });
}
