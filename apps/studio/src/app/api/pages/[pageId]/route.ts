/**
 * @file apps/studio/src/app/api/pages/[pageId]/route.ts
 * @layer studio/app/api
 *
 * @description
 * Route API Studio pour la lecture, la suppression et la mise à jour
 * d’une page par ID dans le Website actif.
 *
 * @remarks
 * Responsabilités :
 * - GET    : retourne une page selon le state demandé (draft/published).
 * - DELETE : supprime une page en draft + détache ses enfants directs.
 * - PATCH  : met à jour une page en draft.
 * - Index (SiteIndexDTO) : source of truth maintenue par patch,
 *   sans rebuild/list post-mutation.
 * - Les repositories sont scopés par Prisma Website.id.
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
import { requireSessionWithWebsite } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import { PageIdParamSchema } from "@compoz/validation/pages/page";
import {
  UpdatePageIntentSchema,
  type UpdatePageIntentDTO,
} from "@compoz/validation/pages/page-intents";

/* -------------------------------------------------------------------------- */
/* GET /api/pages/:pageId                                                     */
/* -------------------------------------------------------------------------- */

export async function GET(req: Request, ctx: { params: unknown }) {
  const NS = "api.studio.pages.id.GET" as const;

  return handleRoute(NS, req, async ({ state }) => {
    const { websiteId } = await requireSessionWithWebsite();

    return logSpan(
      NS,
      { ns: NS, method: "GET", state, websiteId },
      async () => {
        const params = await unwrapParams(ctx.params);

        const { pageId } = parseDTOOrHttp(PageIdParamSchema, params, {
          message: EC.INVALID_ARGUMENT,
          extras: { where: "api.studio.pages.id.GET.params" },
        });

        const pagesRepo = getPagesRepository({ websiteId });
        const page = await pagesRepo.readById(state, pageId);

        if (!page) {
          throwHttp(404, {
            code: EC.PAGE_NOT_FOUND,
            message: EC.PAGE_NOT_FOUND,
          });
        }

        const res: GetPageByIdResponse = { page: page as PageDTO };

        return res;
      },
    );
  });
}

/* -------------------------------------------------------------------------- */
/* DELETE /api/pages/:pageId                                                  */
/* -------------------------------------------------------------------------- */

export async function DELETE(req: Request, ctx: { params: unknown }) {
  const NS = "api.studio.pages.id.DELETE" as const;

  return handleRoute(NS, req, async () => {
    const { websiteId } = await requireSessionWithWebsite();

    return logSpan(
      NS,
      { ns: NS, method: "DELETE", state: DEFAULT_CONTENT_STATE, websiteId },
      async () => {
        const logger = log.child({ ns: NS });

        const params = await unwrapParams(ctx.params);

        const { pageId } = parseDTOOrHttp(PageIdParamSchema, params, {
          message: EC.INVALID_ARGUMENT,
          extras: { where: "api.studio.pages.id.DELETE.params" },
        });

        const pagesRepo = getPagesRepository({ websiteId });
        const siteRepo = getSiteRepository({ websiteId });
        const statusCache = getSiteStatusCache({ websiteId });

        await pagesRepo.ensureBase();
        await siteRepo.ensureBase();

        const nowIso = new Date().toISOString();

        /**
         * 1) Détacher les enfants directs avant suppression.
         *
         * - On lit l’index source of truth.
         * - On détache côté pages via readManyById + putMany.
         * - On garde uniquement le détachement direct à 1 niveau.
         */
        const currentIndex = await siteRepo.readIndex(DEFAULT_CONTENT_STATE);

        const childIds =
          currentIndex?.pages
            .filter((pageRef) => pageRef.parentId === pageId)
            .map((pageRef) => pageRef.id) ?? [];

        if (childIds.length > 0) {
          logger.debug("route.delete.detachChildren.start", {
            websiteId,
            pageId,
            childrenCount: childIds.length,
          });

          const children = await pagesRepo.readManyById(
            DEFAULT_CONTENT_STATE,
            childIds,
          );

          const detached = children
            .filter((page): page is NonNullable<typeof page> => Boolean(page))
            .filter((page) => page.parentId !== null)
            .map((page) => ({
              ...page,
              parentId: null,
              meta: { ...page.meta, updatedAt: nowIso },
            }));

          if (detached.length > 0) {
            await pagesRepo.putMany(DEFAULT_CONTENT_STATE, detached);
          }

          logger.debug("route.delete.detachChildren.done", {
            websiteId,
            pageId,
            childrenCount: childIds.length,
            detachedCount: detached.length,
          });
        }

        /**
         * 2) Supprimer la page via le use-case domaine.
         */
        const runDelete = deletePage({ pages: pagesRepo });
        await runDelete({ pageId });

        /**
         * 3) Patch de l’index source of truth, sans rebuild global.
         *
         * - detachChildrenByParentId : parentId -> null dans l’index.
         * - removePageById : retire la page supprimée.
         */
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
          pages: nextIndexEntity.pages.map((pageRef) => ({
            id: pageRef.id,
            slug: pageRef.slug,
            name: pageRef.name,
            parentId: pageRef.parentId,
          })),
          updatedAt: nowIso,
        };

        await siteRepo.putIndex(DEFAULT_CONTENT_STATE, index);

        logger.debug("route.index.patched", {
          websiteId,
          pagesCount: index.pages.length,
          removed: removed.removed,
        });

        /**
         * Invalidation du cache de status du Website actif.
         *
         * Le cache peut encore être implémenté en KV côté infra,
         * mais son scope métier est le Prisma Website.id.
         */
        try {
          logger.debug?.("route.statusCache.invalidate.start", {
            websiteId,
            invalidateStatus: true,
            invalidateStatusDetails: true,
          });

          await Promise.all([
            statusCache.invalidateStatus(),
            statusCache.invalidateStatusDetails(),
          ]);

          logger.debug?.("route.statusCache.invalidate.done", {
            websiteId,
            invalidateStatus: true,
            invalidateStatusDetails: true,
          });
        } catch (error) {
          logger.error?.("route.statusCache.invalidate.failed", {
            websiteId,
            err: String(error),
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

/* -------------------------------------------------------------------------- */
/* PATCH /api/pages/:pageId                                                   */
/* -------------------------------------------------------------------------- */

export async function PATCH(req: Request, ctx: { params: unknown }) {
  const NS = "api.studio.pages.id.PATCH" as const;

  return handleRoute(NS, req, async () => {
    const { websiteId } = await requireSessionWithWebsite();

    return logSpan(
      NS,
      { ns: NS, method: "PATCH", state: DEFAULT_CONTENT_STATE, websiteId },
      async () => {
        const logger = log.child({ ns: NS });

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

        const pagesRepo = getPagesRepository({ websiteId });
        const siteRepo = getSiteRepository({ websiteId });
        const statusCache = getSiteStatusCache({ websiteId });

        const payload = adaptUpdatePagePayload(dto);

        const runUpdate = updatePage({
          pages: pagesRepo,
          site: siteRepo,
        });

        const { page } = await runUpdate({ pageId, ...payload });

        /**
         * Patch de l’index source of truth, sans rebuild global.
         */
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
          pages: nextIndexEntity.pages.map((pageRef) => ({
            id: pageRef.id,
            slug: pageRef.slug,
            name: pageRef.name,
            parentId: pageRef.parentId,
          })),
          updatedAt: nowIso,
        };

        await siteRepo.putIndex(DEFAULT_CONTENT_STATE, index);

        logger.debug("route.index.patched", {
          websiteId,
          pagesCount: index.pages.length,
        });

        /**
         * Invalidation du cache de status du Website actif.
         *
         * Le cache peut encore être implémenté en KV côté infra,
         * mais son scope métier est le Prisma Website.id.
         */
        try {
          logger.debug?.("route.statusCache.invalidate.start", {
            websiteId,
            invalidateStatus: true,
            invalidateStatusDetails: true,
          });

          await Promise.all([
            statusCache.invalidateStatus(),
            statusCache.invalidateStatusDetails(),
          ]);

          logger.debug?.("route.statusCache.invalidate.done", {
            websiteId,
            invalidateStatus: true,
            invalidateStatusDetails: true,
          });
        } catch (error) {
          logger.error?.("route.statusCache.invalidate.failed", {
            websiteId,
            err: String(error),
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
