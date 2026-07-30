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
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { PageDTO } from "@compoz/core/domain/pages/dto";
import { deletePage } from "@compoz/core/domain/pages/use-cases/delete-page";
import { throwHttp } from "@compoz/http/http-error";
import { readJsonOr400 } from "@compoz/infra/http/read-json";
import type {
  DeletePageResponse,
  GetPageByIdResponse,
  UpdatePageResponse,
} from "@compoz/infra/http/studio/pages.types";
import { log, logSpan } from "@compoz/infra/lib/log";
import {
  getDraftPageStructureTransaction,
  getPagesRepository,
} from "@compoz/infra/pages";
import { getSiteStatusCache } from "@compoz/infra/site";
import { adaptUpdatePagePayload } from "@compoz/studio/app/api/_adapters/pages/pages";
import { persistPagePatch } from "@compoz/studio/app/api/pages/[pageId]/persist-page-patch";
import { requireSessionWithWebsite } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import { PageIdParamSchema } from "@compoz/validation/pages/page";
import {
  DeletePageIntentSchema,
  type DeletePageIntentDTO,
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

        const body = await readJsonOr400(req);
        if (
          body === null ||
          typeof body !== "object" ||
          !("expectedDraftStructureRevision" in body)
        ) {
          throw new DomainError({ code: EC.REVISION_REQUIRED });
        }
        const dto: DeletePageIntentDTO = parseDTOOrHttp(
          DeletePageIntentSchema,
          body,
          {
            message: EC.VALIDATION_ERROR,
            extras: { where: "api.studio.pages.id.DELETE.payload" },
          },
        );

        const structure = getDraftPageStructureTransaction({ websiteId });
        const statusCache = getSiteStatusCache({ websiteId });
        const runDelete = deletePage({ structure });
        const { index, draftStructureRevision } = await runDelete({
          pageId,
          expectedDraftStructureRevision:
            dto.expectedDraftStructureRevision,
        });

        logger.debug("route.index.patched", {
          websiteId,
          pagesCount: index.pages.length,
          removed: true,
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

        const res: DeletePageResponse = {
          index,
          draftStructureRevision,
        };

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
        if (
          body !== null &&
          typeof body === "object" &&
          "metadataChanges" in body &&
          typeof body.metadataChanges === "object" &&
          body.metadataChanges !== null &&
          !("expectedMetaRevision" in body.metadataChanges)
        ) {
          throw new DomainError({ code: EC.REVISION_REQUIRED });
        }
        if (
          body !== null &&
          typeof body === "object" &&
          "parentChange" in body &&
          typeof body.parentChange === "object" &&
          body.parentChange !== null &&
          !("expectedDraftStructureRevision" in body.parentChange)
        ) {
          throw new DomainError({ code: EC.REVISION_REQUIRED });
        }

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
        const structure = getDraftPageStructureTransaction({ websiteId });

        const result = await persistPagePatch(
          { structure },
          { pageId, ...payload },
        );

        logger.debug("route.page.updated", {
          websiteId,
          hasStructure: Boolean(result.structure),
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

        const res: UpdatePageResponse = result;

        return res;
      },
    );
  });
}
