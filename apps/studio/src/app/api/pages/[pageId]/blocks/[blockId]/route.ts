/**
 * @file apps/studio/src/app/api/pages/[pageId]/blocks/[blockId]/route.ts
 * @layer api/routes
 * @description
 * Route API Admin — ressource block d’une page (V0.5).
 *
 * Responsabilités :
 * - PATCH  : met à jour un block `LayoutSection` (draft/published selon `state`).
 * - DELETE : supprime un block (draft/published selon `state`).
 * - Validation des params (pageId, blockId) et des payloads (Zod intents).
 * - Appel des use-cases `updateLayoutSectionBlock` / `deleteBlock` côté domaine.
 * - Invalidation statusCache (KV snapshots) après mutation.
 */

import { throwHttp } from "@compoz/http/http-error";
import { readJsonOr400 } from "@compoz/infra/http/read-json";
import { log, logSpan } from "@compoz/infra/lib/log";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";

import { getPagesRepository } from "@compoz/infra/pages";
import { getSiteStatusCache } from "@compoz/infra/site";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { deleteBlock } from "@compoz/core/domain/pages/use-cases/blocks/delete-block";
import { updateLayoutSectionBlock } from "@compoz/core/domain/pages/use-cases/blocks/update-layout-section-block";

import type { PageDTO } from "@compoz/core/domain/pages/dto";

import type {
  DeleteBlockResponse,
  UpdateLayoutSectionBlockResponse,
} from "@compoz/infra/http/studio/pages.types";
import { adaptUpdateLayoutSectionBlockIntent } from "@compoz/studio/app/api/_adapters/pages/blocks";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";
import {
  UpdateLayoutSectionBlockIntentSchema,
  type UpdateLayoutSectionBlockIntentDTO,
} from "@compoz/validation/pages/blocks/block-intents";
import { PageIdAndBlockIdParamSchema } from "@compoz/validation/routes/params";

import { requireSessionWithTenant } from "@compoz/studio/auth/require-session";

// -------------------------------------------------
// PATCH /api/pages/:pageId/blocks/:blockId → update LayoutSection
// -------------------------------------------------

export async function PATCH(req: Request, ctx: { params: unknown }) {
  const NS = "api.pages.id.blocks.blockId.PATCH" as const;

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
            extras: { where: "api.admin.pages.id.blocks.blockId.PATCH.params" },
          },
        );

        const body = await readJsonOr400(req);

        const dto: UpdateLayoutSectionBlockIntentDTO = parseDTOOrHttp(
          UpdateLayoutSectionBlockIntentSchema,
          body,
          {
            message: EC.VALIDATION_ERROR,
            extras: {
              where: "api.admin.pages.id.blocks.blockId.PATCH.payload",
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

        const runUpdate = updateLayoutSectionBlock({
          pages: pagesRepo,
        });

        const adapted = adaptUpdateLayoutSectionBlockIntent(dto);

        const { page } = await runUpdate({
          pageId,
          blockId: paramBlockId,
          patch: adapted.patch,
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

        const res: UpdateLayoutSectionBlockResponse = { page: page as PageDTO };
        return res;
      },
    );
  });
}

// -------------------------------------------------
// DELETE /api/pages/:pageId/blocks/:blockId → delete block
// -------------------------------------------------

export async function DELETE(req: Request, ctx: { params: unknown }) {
  const NS = "api.pages.id.blocks.blockId.DELETE" as const;

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
              where: "api.admin.pages.id.blocks.blockId.DELETE.params",
            },
          },
        );

        const pagesRepo = getPagesRepository({ tenantId });
        const statusCache = getSiteStatusCache({ tenantId });

        const runDelete = deleteBlock({ pages: pagesRepo });
        const { page } = await runDelete({
          pageId,
          blockId: paramBlockId,
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

        const res: DeleteBlockResponse = { page: page as PageDTO };
        return res;
      },
    );
  });
}
