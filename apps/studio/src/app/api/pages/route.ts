/**
 * @file apps/studio/src/app/api/pages/route.ts
 * @layer studio/app/api
 * @description
 * Route API Studio pour la création et le listing des pages (index du site).
 *
 * Responsabilités :
 * - GET  : retourne l’index des pages (draft-only).
 * - POST : crée une page (draft-only) et met à jour l’index (SoT) par patch (pas de rebuild).
 * - Draft-only : pas de résolution de state (body/query), toujours DEFAULT_CONTENT_STATE.
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
import { requireSessionWithTenant } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import {
  CreatePageIntentSchema,
  type CreatePageIntentDTO,
} from "@compoz/validation/pages/page-intents";

// -------------------------------------------------
// GET /api/pages → index des pages (draft-only)
// -------------------------------------------------

export async function GET(req: Request) {
  const NS = "api.studio.pages.GET" as const;

  return handleRoute(NS, req, async () => {
    const { tenantId } = await requireSessionWithTenant();

    return logSpan(
      NS,
      { ns: NS, method: "GET", state: DEFAULT_CONTENT_STATE, tenantId },
      async () => {
        const siteRepo = getSiteRepository({ tenantId });

        // L’index est la source de vérité pour la liste des pages côté studio.
        const index = await siteRepo.readIndex(DEFAULT_CONTENT_STATE);

        const res: GetPagesIndexResponse = { index };
        return res;
      },
    );
  });
}

// -------------------------------------------------
// POST /api/pages → créer une page + mettre l’index à jour (draft-only)
// -------------------------------------------------

export async function POST(req: Request) {
  const NS = "api.studio.pages.POST" as const;

  return handleRoute(NS, req, async () => {
    const { tenantId } = await requireSessionWithTenant();

    return logSpan(
      NS,
      { ns: NS, method: "POST", state: DEFAULT_CONTENT_STATE, tenantId },
      async () => {
        const lg = log.child({ ns: NS });

        const raw = await readJsonOr400(req);

        const dto: CreatePageIntentDTO = parseDTOOrHttp(
          CreatePageIntentSchema,
          raw,
          {
            message: EC.INVALID_ARGUMENT,
            extras: { where: "api.studio.pages.POST.payload" },
          },
        );

        const pagesRepo = getPagesRepository({ tenantId });
        const siteRepo = getSiteRepository({ tenantId });
        const statusCache = getSiteStatusCache({ tenantId });

        await pagesRepo.ensureBase();
        await siteRepo.ensureBase();

        const nowIso = new Date().toISOString();

        // ✅ A) Lire l’index SoT une seule fois :
        // - sert de base pour patcher l’index après création
        // - sert aussi à construire l’ensemble des slugs existants
        const currentIndex = await siteRepo.readIndex(DEFAULT_CONTENT_STATE);

        const existingSlugs = new Set(
          (currentIndex?.pages ?? [])
            .map((p) => String(p.slug ?? "").trim())
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

        // ✅ B) Patch index SoT (no rebuild)
        const baseIndex: SiteIndexDTO =
          currentIndex ??
          ({
            pages: [],
            updatedAt: nowIso,
          } as SiteIndexDTO);

        const nextIndexEntity = upsertPageRef(baseIndex, {
          id: page.id,
          slug: page.slug,
          title: page.title,
          parentId: page.parentId,
        });

        const index: SiteIndexDTO = {
          pages: nextIndexEntity.pages.map((p) => ({
            id: p.id,
            slug: p.slug,
            title: p.title,
            parentId: p.parentId,
          })),
          updatedAt: nowIso,
        };

        await siteRepo.putIndex(DEFAULT_CONTENT_STATE, index);

        lg.debug("route.index.patched", {
          tenantId,
          pagesCount: index.pages.length,
          createdPageId: page.id,
          createdSlug: page.slug,
        });

        // ✅ Invalidation KV snapshots (best-effort)
        try {
          lg.info?.("route.statusCache.invalidate.start", {
            invalidateStatus: true,
            invalidateStatusDetails: true,
          });

          await Promise.all([
            statusCache.invalidateStatus(),
            statusCache.invalidateStatusDetails(),
          ]);

          lg.info?.("route.statusCache.invalidate.done", {
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

        const res: CreatePageResponse = {
          page: page as PageDTO,
          index,
        };

        return res;
      },
    );
  });
}
