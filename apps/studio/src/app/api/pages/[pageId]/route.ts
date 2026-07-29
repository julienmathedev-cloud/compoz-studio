/**
 * @file apps/studio/src/app/api/pages/[pageId]/route.ts
 * @layer studio/app/api
 *
 * @description
 * Studio API route for reading, deleting, and updating a page within the active Website.
 *
 * @remarks
 * - Delete mutations detach direct child pages before removing the draft page.
 * - The page index is projected from Prisma Page rows ordered by `Page.position`.
 * - Page updates persist the page and affected menu settings atomically.
 * - Repositories are scoped by Prisma Website.id.
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
import { PrismaPagesRepository } from "@compoz/infra/pages/prisma-pages-repository";
import { prisma } from "@compoz/infra/prisma/prisma-client";
import { getSiteRepository, getSiteStatusCache } from "@compoz/infra/site";
import { PrismaSiteRepository } from "@compoz/infra/site/prisma-site-repository";
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
        const pageRead = await pagesRepo.readByIdWithRevisions(state, pageId);

        if (!pageRead) {
          throwHttp(404, {
            code: EC.PAGE_NOT_FOUND,
            message: EC.PAGE_NOT_FOUND,
          });
        }

        const res: GetPageByIdResponse = {
          page: pageRead.page as PageDTO,
          revisions: pageRead.revisions,
        };

        return res;
      },
    );
  });
}

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
         * Detach direct children before deleting the page.
         *
         * - Reads the source-of-truth index.
         * - Updates only draft Page parent references.
         * - Only performs one-level direct child detachment.
         */
        const currentIndex = await siteRepo.readIndex(DEFAULT_CONTENT_STATE);

        logger.debug("route.delete.detachChildren.start", {
          websiteId,
          pageId,
        });

        const detachedCount = await pagesRepo.detachDraftPageChildren({
          parentId: pageId,
          metaUpdatedAt: nowIso,
        });

        logger.debug("route.delete.detachChildren.done", {
          websiteId,
          pageId,
          detachedCount,
        });

        const runDelete = deletePage({ pages: pagesRepo });
        await runDelete({ pageId });

        /**
         * Patch page positions for the delete flow.
         *
         * - `detachChildrenByParentId` sets `parentId` to `null` in the index.
         * - `removePageById` removes the deleted page reference.
         *
         * This existing delete behavior remains outside the slug-update fix
         * and should be reassessed during the dedicated SiteIndex review.
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
         * Invalidate the active Website status cache.
         *
         * The cache may still be implemented with KV in infra,
         * but its business scope is the Prisma Website.id.
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

        const statusCache = getSiteStatusCache({ websiteId });
        const payload = adaptUpdatePagePayload(dto);

        const { page, index } = await prisma.$transaction(
          async (transactionClient) => {
            const pagesRepo = new PrismaPagesRepository({
              websiteId,
              client: transactionClient,
            });

            const siteRepo = new PrismaSiteRepository({
              websiteId,
              client: transactionClient,
            });

            const runUpdate = updatePage({
              pages: pagesRepo,
              site: siteRepo,
            });

            const { page } = await runUpdate({
              pageId,
              ...payload,
            });

            /**
             * The index is a projection of Page rows, not a separately stored
             * aggregate. Reading it after the page write returns the updated
             * page projection without rewriting every page position.
             */
            const index = await siteRepo.readIndex(DEFAULT_CONTENT_STATE);

            return { page, index };
          },
        );

        logger.debug("route.index.read", {
          websiteId,
          pagesCount: index.pages.length,
        });

        /**
         * Invalidate the active Website status cache.
         *
         * The cache may still be implemented with KV in infra,
         * but its business scope is the Prisma Website.id.
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
