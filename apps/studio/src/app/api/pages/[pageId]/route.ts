/**
 * @file apps/studio/src/app/api/pages/[pageId]/route.ts
 * @layer api/routes
 * @description
 * Route API Admin pour la lecture, la suppression et la mise à jour d’une page par ID.
 *
 * Responsabilités :
 * - GET    : retourne une page selon le state (draft/published).
 * - DELETE : supprime une page (draft-only) et recalcule l’index.
 * - PATCH  : met à jour une page (draft-only) et recalcule l’index.
 * - L’index (SiteIndexDTO) est reconstruit à chaque mutation pour rester la SoT.
 */
import { throwHttp } from "@compoz/http/http-error";
import { readJsonOr400 } from "@compoz/infra/http/read-json";
import { log, logSpan } from "@compoz/infra/lib/log";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { deletePage } from "@compoz/core/domain/pages/use-cases/delete-page";
import { updatePage } from "@compoz/core/domain/pages/use-cases/update-page";
import { getPagesRepository } from "@compoz/infra/pages";
import { getSiteRepository, getSiteStatusCache } from "@compoz/infra/site";

import type { PageDTO } from "@compoz/core/domain/pages/dto";
import type { SiteIndexDTO } from "@compoz/core/domain/site/dto";

import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { adaptUpdatePagePayload } from "@compoz/studio/app/api/_adapters/pages/pages";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";
import { PageIdParamSchema } from "@compoz/validation/pages/page";
import {
  UpdatePageIntentSchema,
  type UpdatePageIntentDTO,
} from "@compoz/validation/pages/page-intents";

import type {
  DeletePageResponse,
  GetPageByIdResponse,
  UpdatePageResponse,
} from "@compoz/infra/http/studio/pages.types";

import { requireSessionWithTenant } from "@compoz/studio/auth/require-session";

/* -------------------------------------------------------------------------- */
/* Helpers index                                                              */
/* -------------------------------------------------------------------------- */

async function rebuildAndWriteIndex(args: {
  tenantId: string;
  state: typeof WRITE_CONTENT_STATE;
}) {
  const pagesRepo = getPagesRepository({ tenantId: args.tenantId });
  const siteRepo = getSiteRepository({ tenantId: args.tenantId });

  const summaries = await pagesRepo.list(args.state);

  const index: SiteIndexDTO = {
    pages: summaries.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      parentId: p.parentId,
    })),
    updatedAt: new Date().toISOString(),
  };

  await siteRepo.writeIndex(args.state, index);

  return { index, pagesCount: index.pages.length };
}

// -------------------------------------------------
// GET /api/pages/:pageId → lire une page
// -------------------------------------------------

export async function GET(req: Request, ctx: { params: unknown }) {
  const NS = "api.pages.id.GET" as const;

  return handleRoute(NS, req, async ({ state }) => {
    const { tenantId } = await requireSessionWithTenant();

    return logSpan(NS, { ns: NS, method: "GET", state, tenantId }, async () => {
      const params = await unwrapParams(ctx.params);

      const { pageId } = parseDTOOrHttp(PageIdParamSchema, params, {
        message: EC.INVALID_ARGUMENT,
        extras: { where: "api.pages.id.GET.params" },
      });

      const pagesRepo = getPagesRepository({ tenantId });
      const page = await pagesRepo.readById(state, pageId);

      if (!page) {
        throwHttp(404, { code: EC.PAGE_NOT_FOUND, message: EC.PAGE_NOT_FOUND });
      }

      const res: GetPageByIdResponse = { page: page as PageDTO };
      return res;
    });
  });
}

// -------------------------------------------------
// DELETE /api/pages/:pageId → supprimer (draft-only)
// -------------------------------------------------

export async function DELETE(req: Request, ctx: { params: unknown }) {
  const NS = "api.pages.id.DELETE" as const;

  return handleRoute(NS, req, async () => {
    const { tenantId } = await requireSessionWithTenant();

    return logSpan(
      NS,
      { ns: NS, method: "DELETE", state: WRITE_CONTENT_STATE, tenantId },
      async () => {
        const lg = log.child({ ns: NS });

        const params = await unwrapParams(ctx.params);

        const { pageId } = parseDTOOrHttp(PageIdParamSchema, params, {
          message: EC.INVALID_ARGUMENT,
          extras: { where: "api.admin.pages.id.DELETE.params" },
        });

        const pagesRepo = getPagesRepository({ tenantId });
        const statusCache = getSiteStatusCache({ tenantId });

        await pagesRepo.ensureBase();

        // ✅ 1) Détacher les enfants directs (1 niveau) avant suppression
        const summaries = await pagesRepo.list(WRITE_CONTENT_STATE);
        const childIds = summaries
          .filter((p) => p.parentId === pageId)
          .map((p) => p.id);

        if (childIds.length > 0) {
          const now = new Date().toISOString();

          lg.debug("route.delete.detachChildren.start", {
            tenantId,
            pageId,
            childrenCount: childIds.length,
          });

          await Promise.all(
            childIds.map(async (childId) => {
              const child = await pagesRepo.readById(
                WRITE_CONTENT_STATE,
                childId,
              );
              if (!child) return;
              if (child.parentId === null) return;

              await pagesRepo.put(WRITE_CONTENT_STATE, {
                ...child,
                parentId: null,
                meta: {
                  ...child.meta,
                  updatedAt: now,
                },
              });
            }),
          );

          lg.debug("route.delete.detachChildren.done", {
            tenantId,
            pageId,
            childrenCount: childIds.length,
          });
        }

        // ✅ 2) Supprimer la page (domain pur)
        const runDelete = deletePage({ pages: pagesRepo });
        await runDelete({ pageId });

        // ✅ 3) Rebuild index (SoT)
        const { index, pagesCount } = await rebuildAndWriteIndex({
          tenantId,
          state: WRITE_CONTENT_STATE,
        });

        lg.debug("route.index.rebuilt", { tenantId, pagesCount });

        // ✅ 4) Invalidation KV (best-effort)
        try {
          lg.info?.("route.statusCache.invalidateAll.start", {});
          await statusCache.invalidateAll();
          lg.info?.("route.statusCache.invalidateAll.done", {});
        } catch (e) {
          lg.error?.("route.statusCache.invalidateAll.failed", {
            err: String(e),
          });
        }

        const res: DeletePageResponse = { index };
        return res;
      },
    );
  });
}

// -------------------------------------------------
// PATCH /api/pages/:pageId → update (draft-only)
// -------------------------------------------------

export async function PATCH(req: Request, ctx: { params: unknown }) {
  const NS = "api.pages.id.PATCH" as const;

  return handleRoute(NS, req, async () => {
    const { tenantId } = await requireSessionWithTenant();

    return logSpan(
      NS,
      { ns: NS, method: "PATCH", state: WRITE_CONTENT_STATE, tenantId },
      async () => {
        const lg = log.child({ ns: NS });

        const params = await unwrapParams(ctx.params);

        const { pageId } = parseDTOOrHttp(PageIdParamSchema, params, {
          message: EC.INVALID_ARGUMENT,
          extras: { where: "api.admin.pages.id.PATCH.params" },
        });

        const body = await readJsonOr400(req);

        const dto: UpdatePageIntentDTO = parseDTOOrHttp(
          UpdatePageIntentSchema,
          body,
          {
            message: EC.VALIDATION_ERROR,
            extras: { where: "api.admin.pages.id.PATCH.payload" },
          },
        );

        const pagesRepo = getPagesRepository({ tenantId });
        const siteRepo = getSiteRepository({ tenantId }); // slug rename → update menus
        const statusCache = getSiteStatusCache({ tenantId });

        const payload = adaptUpdatePagePayload(dto);

        // domain pur (pas de statusCache)
        const runUpdate = updatePage({
          pages: pagesRepo,
          site: siteRepo,
        });

        const { page } = await runUpdate({ pageId, ...payload });

        const { index, pagesCount } = await rebuildAndWriteIndex({
          tenantId,
          state: WRITE_CONTENT_STATE,
        });

        lg.debug("route.index.rebuilt", { tenantId, pagesCount });

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

        const res: UpdatePageResponse = {
          page: page as PageDTO,
          index,
        };
        return res;
      },
    );
  });
}
