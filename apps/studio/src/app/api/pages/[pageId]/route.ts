/**
 * @file apps/studio/src/app/api/pages/[pageId]/route.ts
 * @layer studio/app/api
 * @description
 * Route API Studio pour la lecture, la suppression et la mise à jour d’une page par ID.
 *
 * Responsabilités :
 * - GET    : retourne une page selon le state (draft/published).
 * - DELETE : supprime une page (draft-only) + détache ses enfants directs.
 * - PATCH  : met à jour une page (draft-only).
 * - Index (SiteIndexDTO) : SoT maintenue par patch (pas de rebuild/list post-mutation).
 */

import "server-only";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import type { PageDTO } from "@compoz/core/domain/pages/dto";
import { deletePage } from "@compoz/core/domain/pages/use-cases/delete-page";
import { updatePage } from "@compoz/core/domain/pages/use-cases/update-page";
import type { SiteIndexDTO } from "@compoz/core/domain/site/dto";
import {
  detachChildrenByParentId,
  removePageById,
  upsertPageRef,
} from "@compoz/core/domain/site/index/utils";
import { throwHttp } from "@compoz/http/http-error";
import { readJsonOr400 } from "@compoz/infra/http/read-json";
import type {
  DeletePageResponse,
  GetPageByIdResponse,
  UpdatePageResponse,
} from "@compoz/infra/http/studio/pages.types";
import { log, logSpan } from "@compoz/infra/lib/log";
import { getPagesRepository } from "@compoz/infra/pages";
import { getSiteRepository, getSiteStatusCache } from "@compoz/infra/site";
import { adaptUpdatePagePayload } from "@compoz/studio/app/api/_adapters/pages/pages";
import { requireSessionWithTenant } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import { PageIdParamSchema } from "@compoz/validation/pages/page";
import {
  UpdatePageIntentSchema,
  type UpdatePageIntentDTO,
} from "@compoz/validation/pages/page-intents";

// -------------------------------------------------
// GET /api/pages/:pageId → lire une page
// -------------------------------------------------

export async function GET(req: Request, ctx: { params: unknown }) {
  const NS = "api.studio.pages.id.GET" as const;

  return handleRoute(NS, req, async ({ state }) => {
    const { tenantId } = await requireSessionWithTenant();

    return logSpan(NS, { ns: NS, method: "GET", state, tenantId }, async () => {
      const params = await unwrapParams(ctx.params);

      const { pageId } = parseDTOOrHttp(PageIdParamSchema, params, {
        message: EC.INVALID_ARGUMENT,
        extras: { where: "api.studio.pages.id.GET.params" },
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
  const NS = "api.studio.pages.id.DELETE" as const;

  return handleRoute(NS, req, async () => {
    const { tenantId } = await requireSessionWithTenant();

    return logSpan(
      NS,
      { ns: NS, method: "DELETE", state: DEFAULT_CONTENT_STATE, tenantId },
      async () => {
        const lg = log.child({ ns: NS });

        const params = await unwrapParams(ctx.params);

        const { pageId } = parseDTOOrHttp(PageIdParamSchema, params, {
          message: EC.INVALID_ARGUMENT,
          extras: { where: "api.studio.pages.id.DELETE.params" },
        });

        const pagesRepo = getPagesRepository({ tenantId });
        const siteRepo = getSiteRepository({ tenantId });
        const statusCache = getSiteStatusCache({ tenantId });

        await pagesRepo.ensureBase();
        await siteRepo.ensureBase();

        const nowIso = new Date().toISOString();

        // ✅ 1) Détacher les enfants directs (1 niveau) avant suppression (KV-optimized)
        // - On lit l’index SoT (beaucoup moins coûteux qu’un list pages)
        // - On détache côté pages via readManyById + putMany
        const currentIndex = await siteRepo.readIndex(DEFAULT_CONTENT_STATE);

        const childIds =
          currentIndex?.pages
            .filter((p) => p.parentId === pageId)
            .map((p) => p.id) ?? [];

        if (childIds.length > 0) {
          lg.debug("route.delete.detachChildren.start", {
            tenantId,
            pageId,
            childrenCount: childIds.length,
          });

          const children = await pagesRepo.readManyById(
            DEFAULT_CONTENT_STATE,
            childIds,
          );

          const detached = children
            .filter((p): p is NonNullable<typeof p> => Boolean(p))
            .filter((p) => p.parentId !== null)
            .map((p) => ({
              ...p,
              parentId: null,
              meta: { ...p.meta, updatedAt: nowIso },
            }));

          if (detached.length > 0) {
            await pagesRepo.putMany(DEFAULT_CONTENT_STATE, detached);
          }

          lg.debug("route.delete.detachChildren.done", {
            tenantId,
            pageId,
            childrenCount: childIds.length,
            detachedCount: detached.length,
          });
        }

        // ✅ 2) Supprimer la page (domain pur)
        const runDelete = deletePage({ pages: pagesRepo });
        await runDelete({ pageId });

        // ✅ 3) Patch index SoT (no rebuild)
        // - detachChildrenByParentId: parentId -> null dans l’index
        // - removePageById: retire la page supprimée
        const baseIndex =
          currentIndex ??
          ({
            pages: [],
            updatedAt: nowIso,
          } as SiteIndexDTO);

        const detachedIndexEntity = detachChildrenByParentId(baseIndex, pageId);

        const removed = removePageById(detachedIndexEntity, pageId);
        const nextIndexEntity = removed.next;

        const index: SiteIndexDTO = {
          pages: nextIndexEntity.pages.map((p) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            parentId: p.parentId,
          })),
          updatedAt: nowIso,
        };

        await siteRepo.putIndex(DEFAULT_CONTENT_STATE, index);

        lg.debug("route.index.patched", {
          tenantId,
          pagesCount: index.pages.length,
          removed: removed.removed,
        });

        // ✅ Invalidation KV snapshots (best-effort)
        try {
          lg.debug?.("route.statusCache.invalidate.start", {
            invalidateStatus: true,
            invalidateStatusDetails: true,
          });

          await Promise.all([
            statusCache.invalidateStatus(),
            statusCache.invalidateStatusDetails(),
          ]);

          lg.debug?.("route.statusCache.invalidate.done", {
            invalidateStatus: true,
            invalidateStatusDetails: true,
          });
        } catch (e) {
          lg.error?.("route.statusCache.invalidate.failed", {
            err: String(e),
            invalidateStatus: true,
            invalidateStatusDetails: true,
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
  const NS = "api.studio.pages.id.PATCH" as const;

  return handleRoute(NS, req, async () => {
    const { tenantId } = await requireSessionWithTenant();

    return logSpan(
      NS,
      { ns: NS, method: "PATCH", state: DEFAULT_CONTENT_STATE, tenantId },
      async () => {
        const lg = log.child({ ns: NS });

        const params = await unwrapParams(ctx.params);

        const { pageId } = parseDTOOrHttp(PageIdParamSchema, params, {
          message: EC.INVALID_ARGUMENT,
          extras: { where: "api.studio.pages.id.PATCH.params" },
        });

        const body = await readJsonOr400(req);

        const dto: UpdatePageIntentDTO = parseDTOOrHttp(
          UpdatePageIntentSchema,
          body,
          {
            message: EC.VALIDATION_ERROR,
            extras: { where: "api.studio.pages.id.PATCH.payload" },
          },
        );

        const pagesRepo = getPagesRepository({ tenantId });
        const siteRepo = getSiteRepository({ tenantId }); // slug rename → update menus (domain)
        const statusCache = getSiteStatusCache({ tenantId });

        const payload = adaptUpdatePagePayload(dto);

        // domain pur (pas de statusCache)
        const runUpdate = updatePage({
          pages: pagesRepo,
          site: siteRepo,
        });

        const { page } = await runUpdate({ pageId, ...payload });

        // ✅ Patch index SoT (no rebuild)
        await siteRepo.ensureBase();

        const nowIso = new Date().toISOString();

        const currentIndex = await siteRepo.readIndex(DEFAULT_CONTENT_STATE);

        const baseIndex =
          currentIndex ??
          ({
            pages: [],
            updatedAt: nowIso,
          } as SiteIndexDTO);

        const nextIndexEntity = upsertPageRef(baseIndex, {
          id: page.id,
          slug: page.slug,
          name: page.name,
          parentId: page.parentId,
        });

        const index: SiteIndexDTO = {
          pages: nextIndexEntity.pages.map((p) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            parentId: p.parentId,
          })),
          updatedAt: nowIso,
        };

        await siteRepo.putIndex(DEFAULT_CONTENT_STATE, index);

        lg.debug("route.index.patched", {
          tenantId,
          pagesCount: index.pages.length,
        });

        // ✅ Invalidation KV snapshots (best-effort)
        try {
          lg.debug?.("route.statusCache.invalidate.start", {
            invalidateStatus: true,
            invalidateStatusDetails: true,
          });

          await Promise.all([
            statusCache.invalidateStatus(),
            statusCache.invalidateStatusDetails(),
          ]);

          lg.debug?.("route.statusCache.invalidate.done", {
            invalidateStatus: true,
            invalidateStatusDetails: true,
          });
        } catch (e) {
          lg.error?.("route.statusCache.invalidate.failed", {
            err: String(e),
            invalidateStatus: true,
            invalidateStatusDetails: true,
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
