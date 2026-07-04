/**
 * @file apps/studio/src/app/api/pages/route.ts
 * @layer studio/app/api
 *
 * @description
 * Route API Studio pour la création et le listing des pages du Website actif.
 *
 * @remarks
 * Responsabilités :
 * - GET  : retourne l’index des pages en draft.
 * - POST : crée une page en draft et met à jour l’index draft par patch.
 * - Draft-only : pas de résolution de state via body/query,
 *   toujours DEFAULT_CONTENT_STATE.
 * - Les repositories sont scopés par Prisma Website.id.
 */

import "server-only";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import type { PageDTO } from "@compoz/core/domain/pages/dto";
import { createPage } from "@compoz/core/domain/pages/use-cases/create-page";
import type { SiteIndexDTO } from "@compoz/core/domain/site/dto";
import { upsertPageRef } from "@compoz/core/domain/site/index/utils";
import { readJsonOr400 } from "@compoz/infra/http/read-json";
import type {
  CreatePageResponse,
  GetPagesIndexResponse,
} from "@compoz/infra/http/studio/pages.types";
import { getIdGenerator } from "@compoz/infra/id/index";
import { log, logSpan } from "@compoz/infra/lib/log";
import { getPagesRepository } from "@compoz/infra/pages";
import { getSiteRepository, getSiteStatusCache } from "@compoz/infra/site";
import { adaptCreatePagePayload } from "@compoz/studio/app/api/_adapters/pages/pages";
import { requireSessionWithWebsite } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import {
  CreatePageIntentSchema,
  type CreatePageIntentDTO,
} from "@compoz/validation/pages/page-intents";

/* -------------------------------------------------------------------------- */
/* GET /api/pages                                                             */
/* -------------------------------------------------------------------------- */

export async function GET(req: Request) {
  const NS = "api.studio.pages.GET" as const;

  return handleRoute(NS, req, async () => {
    const { websiteId } = await requireSessionWithWebsite();

    return logSpan(
      NS,
      { ns: NS, method: "GET", state: DEFAULT_CONTENT_STATE, websiteId },
      async () => {
        const siteRepo = getSiteRepository({ websiteId });

        // L’index est la source de vérité pour la liste des pages côté Studio.
        const index = await siteRepo.readIndex(DEFAULT_CONTENT_STATE);

        const res: GetPagesIndexResponse = { index };

        return res;
      },
    );
  });
}

/* -------------------------------------------------------------------------- */
/* POST /api/pages                                                            */
/* -------------------------------------------------------------------------- */

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

        const dto: CreatePageIntentDTO = parseDTOOrHttp(
          CreatePageIntentSchema,
          raw,
          {
            message: EC.INVALID_ARGUMENT,
            extras: { where: "api.studio.pages.POST.payload" },
          },
        );

        const pagesRepo = getPagesRepository({ websiteId });
        const siteRepo = getSiteRepository({ websiteId });
        const statusCache = getSiteStatusCache({ websiteId });

        await pagesRepo.ensureBase();
        await siteRepo.ensureBase();

        const nowIso = new Date().toISOString();

        /**
         * A) Lire l’index source of truth une seule fois :
         * - sert de base pour patcher l’index après création,
         * - sert aussi à construire l’ensemble des slugs existants.
         */
        const currentIndex = await siteRepo.readIndex(DEFAULT_CONTENT_STATE);

        const existingSlugs = new Set(
          (currentIndex?.pages ?? [])
            .map((pageRef) => String(pageRef.slug ?? "").trim())
            .filter(Boolean),
        );

        const idGenerator = getIdGenerator();

        const runCreate = createPage({
          pages: pagesRepo,
          idGenerator,
          nowIso: () => nowIso,
        });

        const payload = adaptCreatePagePayload(dto);
        const { page } = await runCreate({ ...payload, existingSlugs });

        /**
         * B) Patch de l’index source of truth, sans rebuild global.
         */
        const baseIndex: SiteIndexDTO =
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
          createdPageId: page.id,
          createdSlug: page.slug,
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

        const res: CreatePageResponse = {
          page: page as PageDTO,
          index,
        };

        return res;
      },
    );
  });
}
