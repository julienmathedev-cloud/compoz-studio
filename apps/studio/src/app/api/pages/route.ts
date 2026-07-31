/**
 * @file apps/studio/src/app/api/pages/route.ts
 * @layer studio/app/api
 *
 * @description
 * Studio API route for listing and creating draft pages of the active Website.
 *
 * @remarks
 * - Draft-only route: always reads and writes `DEFAULT_CONTENT_STATE`.
 * - Page creation runs through the Website-locked draft structure transaction.
 * - Repositories are scoped by Prisma Website.id.
 */

import "server-only";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { PageDTO } from "@compoz/core/domain/pages/dto";
import { createPage } from "@compoz/core/domain/pages/use-cases/create-page";
import { readJsonOr400 } from "@compoz/infra/http/read-json";
import type {
  CreatePageResponse,
  GetPagesIndexResponse,
} from "@compoz/infra/http/studio/pages.types";
import { getIdGenerator } from "@compoz/infra/id/index";
import { log, logSpan } from "@compoz/infra/lib/log";
import {
  getDraftPageStructureTransaction,
  getPagesRepository,
} from "@compoz/infra/pages";
import { getSiteRepository, getSiteStatusCache } from "@compoz/infra/site";
import { adaptCreatePagePayload } from "@compoz/studio/app/api/_adapters/pages/pages";
import { requireSessionWithWebsite } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import {
  CreatePageIntentSchema,
  type CreatePageIntentDTO,
} from "@compoz/validation/pages/page-intents";

export async function GET(req: Request) {
  const NS = "api.studio.pages.GET" as const;

  return handleRoute(NS, req, async () => {
    const { websiteId } = await requireSessionWithWebsite();

    return logSpan(
      NS,
      { ns: NS, method: "GET", state: DEFAULT_CONTENT_STATE, websiteId },
      async () => {
        const siteRepo = getSiteRepository({ websiteId });

        // Page rows are the persisted source; the index is their Studio projection.
        const { index, draftStructureRevision } =
          await siteRepo.readDraftIndexWithRevision();

        const res: GetPagesIndexResponse = {
          index,
          draftStructureRevision,
        };

        return res;
      },
    );
  });
}

export async function POST(req: Request) {
  const NS = "api.studio.pages.POST" as const;

  return handleRoute(NS, req, async () => {
    const { websiteId } = await requireSessionWithWebsite();

    return logSpan(
      NS,
      { ns: NS, method: "POST", state: DEFAULT_CONTENT_STATE, websiteId },
      async () => {
        const logger = log.child({ ns: NS });

        const raw = await readJsonOr400(req);
        if (
          raw === null ||
          typeof raw !== "object" ||
          !("expectedDraftStructureRevision" in raw)
        ) {
          throw new DomainError({ code: EC.REVISION_REQUIRED });
        }

        const dto: CreatePageIntentDTO = parseDTOOrHttp(
          CreatePageIntentSchema,
          raw,
          {
            message: EC.INVALID_ARGUMENT,
            extras: { where: "api.studio.pages.POST.payload" },
          },
        );

        const pagesRepo = getPagesRepository({ websiteId });
        const structure = getDraftPageStructureTransaction({ websiteId });
        const statusCache = getSiteStatusCache({ websiteId });

        const nowIso = new Date().toISOString();

        const idGenerator = getIdGenerator();

        const runCreate = createPage({
          pages: pagesRepo,
          structure,
          idGenerator,
          nowIso: () => nowIso,
        });

        const payload = adaptCreatePagePayload(dto);
        const { page, revisions, index, draftStructureRevision } =
          await runCreate(payload);

        logger.debug("route.index.patched", {
          websiteId,
          pagesCount: index.pages.length,
          createdPageId: page.id,
          createdSlug: page.slug,
        });

        /**
         * Invalidates the active Website status cache.
         *
         * The cache may still be backed by KV in infra, but its business scope is
         * the Prisma Website.id.
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

        const res: CreatePageResponse = {
          page: page as PageDTO,
          revisions,
          index,
          draftStructureRevision,
        };

        return res;
      },
    );
  });
}
