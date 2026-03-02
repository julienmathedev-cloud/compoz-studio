/**
 * @file apps/studio/src/app/api/pages/[pageId]/blocks/route.ts
 * @layer api/routes
 * @description
 * Route API Admin — collection de blocks d’une page (V0.5).
 *
 * Responsabilités :
 * - GET  : liste les blocks d’une page (draft/published selon `state`).
 * - POST : ajoute un block `LayoutSection` à la page (draft-only en V0.5).
 * - Validation du paramètre `pageId` (params) et du payload (Zod intent).
 * - Appel des use-cases côté domaine.
 * - Invalidation statusCache (KV snapshots) après mutation.
 */

import { throwHttp } from "@compoz/http/http-error";
import { readJsonOr400 } from "@compoz/infra/http/read-json";
import { log, logSpan } from "@compoz/infra/lib/log";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";

import { getPagesRepository } from "@compoz/infra/pages";
import { getSiteStatusCache } from "@compoz/infra/site";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { addLayoutSectionBlock } from "@compoz/core/domain/pages/use-cases/blocks/add-layout-section-block";

import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { PageDTO } from "@compoz/core/domain/pages/dto";
import type {
  AddLayoutSectionBlockResponse,
  ListPageBlocksResponse,
} from "@compoz/infra/http/studio/pages.types";
import {
  CreateLayoutSectionBlockIntentSchema,
  type CreateLayoutSectionBlockIntentDTO,
} from "@compoz/validation/pages/blocks/block-intents";
import { PageIdParamSchema } from "@compoz/validation/pages/page";
import { adaptCreateLayoutSectionBlockIntent } from "@compoz/studio/app/api/_adapters/pages/blocks";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";

// -------------------------------------------------
// GET /api/pages/:pageId/blocks → lister les blocks
// -------------------------------------------------

export async function GET(req: Request, ctx: { params: unknown }) {
  const NS = "api.pages.id.blocks.GET" as const;

  return handleRoute(NS, req, async ({ state }) => {
    return logSpan(NS, { ns: NS, method: "GET", state }, async () => {
      const params = await unwrapParams(ctx.params);

      const { pageId } = parseDTOOrHttp(PageIdParamSchema, params, {
        message: EC.INVALID_ARGUMENT,
        extras: { where: "api.admin.pages.id.blocks.GET.params" },
      });

      const pagesRepo = getPagesRepository();
      const page = await pagesRepo.readById(state, pageId);

      if (!page) {
        throwHttp(404, { code: EC.PAGE_NOT_FOUND, message: EC.PAGE_NOT_FOUND });
      }

      const res: ListPageBlocksResponse = {
        blocks: page.blocks ?? [],
      };
      return res;
    });
  });
}

// -------------------------------------------------
// POST /api/pages/:pageId/blocks → ajouter un block LayoutSection (draft-only)
// -------------------------------------------------

export async function POST(req: Request, ctx: { params: unknown }) {
  const NS = "api.pages.id.blocks.POST" as const;

  return handleRoute(NS, req, async () => {
    return logSpan(
      NS,
      { ns: NS, method: "POST", state: WRITE_CONTENT_STATE },
      async () => {
        const lg = log.child({ ns: NS });

        const params = await unwrapParams(ctx.params);

        const { pageId } = parseDTOOrHttp(PageIdParamSchema, params, {
          message: EC.INVALID_ARGUMENT,
          extras: { where: "api.admin.pages.id.blocks.POST.params" },
        });

        const body = await readJsonOr400(req);

        const dto: CreateLayoutSectionBlockIntentDTO = parseDTOOrHttp(
          CreateLayoutSectionBlockIntentSchema,
          body,
          {
            message: EC.VALIDATION_ERROR,
            extras: { where: "api.admin.pages.id.blocks.POST.payload" },
          },
        );

        const pagesRepo = getPagesRepository();
        const statusCache = getSiteStatusCache();

        const patch = adaptCreateLayoutSectionBlockIntent(dto);

        const runAdd = addLayoutSectionBlock({
          pages: pagesRepo,
        });

        const { page } = await runAdd({
          pageId,
          ...patch,
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

        const res: AddLayoutSectionBlockResponse = { page: page as PageDTO };
        return res;
      },
    );
  });
}
