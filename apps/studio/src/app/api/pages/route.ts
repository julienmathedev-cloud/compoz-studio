/**
 * @file apps/studio/src/app/api/pages/route.ts
 * @layer api/routes
 * @description
 * Route API Admin pour la création et le listing des pages (index du site).
 *
 * Responsabilités :
 * - GET  : retourne l’index des pages (draft-only).
 * - POST : crée une page (draft-only) et met à jour l’index.
 * - Draft-only : pas de résolution de state (body/query), toujours WRITE_CONTENT_STATE.
 * - L’index (SiteIndexDTO) est reconstruit et persisté via SiteRepository après chaque mutation.
 */

import { readJsonOr400 } from "@compoz/infra/http/read-json";
import { log, logSpan } from "@compoz/infra/lib/log";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";

import { getPagesRepository } from "@compoz/infra/pages";
import { getSiteRepository, getSiteStatusCache } from "@compoz/infra/site";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import type { PageDTO } from "@compoz/core/domain/pages/dto";
import { createPage } from "@compoz/core/domain/pages/use-cases/create-page";
import type { SiteIndexDTO } from "@compoz/core/domain/site/dto";
import { getIdGenerator } from "@compoz/infra/id/index";
import { adaptCreatePagePayload } from "@compoz/studio/app/api/_adapters/pages/pages";

import {
  CreatePageIntentSchema,
  type CreatePageIntentDTO,
} from "@compoz/validation/pages/page-intents";

import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type {
  CreatePageResponse,
  GetPagesIndexResponse,
} from "@compoz/infra/http/studio/pages.types";

import { requireSessionWithTenant } from "@compoz/studio/auth/require-session";

// -------------------------------------------------
// GET /api/pages → index des pages (draft-only)
// -------------------------------------------------

export async function GET(req: Request) {
  const NS = "api.pages.GET" as const;

  return handleRoute(NS, req, async () => {
    const { tenantId } = await requireSessionWithTenant();

    return logSpan(
      NS,
      { ns: NS, method: "GET", state: WRITE_CONTENT_STATE, tenantId },
      async () => {
        const siteRepo = getSiteRepository({ tenantId });

        // L’index est la source de vérité pour la liste des pages côté admin
        const index = await siteRepo.readIndex(WRITE_CONTENT_STATE);

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
  const NS = "api.pages.POST" as const;

  return handleRoute(NS, req, async () => {
    const { tenantId } = await requireSessionWithTenant();

    return logSpan(
      NS,
      { ns: NS, method: "POST", state: WRITE_CONTENT_STATE, tenantId },
      async () => {
        const lg = log.child({ ns: NS });

        const raw = await readJsonOr400(req);

        const dto: CreatePageIntentDTO = parseDTOOrHttp(
          CreatePageIntentSchema,
          raw,
          {
            message: EC.INVALID_ARGUMENT,
            extras: { where: "api.admin.pages.POST.payload" },
          },
        );

        const pagesRepo = getPagesRepository({ tenantId });
        const siteRepo = getSiteRepository({ tenantId });
        const statusCache = getSiteStatusCache({ tenantId });

        await pagesRepo.ensureBase();

        // ✅ A) Build a local slug index ONCE to avoid KV scans in createPage.
        const existingSummaries = await pagesRepo.list(WRITE_CONTENT_STATE);
        const existingSlugs = new Set(
          existingSummaries
            .map((p) => String(p.slug ?? "").trim())
            .filter(Boolean),
        );

        const idGenerator = getIdGenerator();
        const runCreate = createPage({ pages: pagesRepo, idGenerator });

        const payload = adaptCreatePagePayload(dto);
        const { page } = await runCreate({ ...payload, existingSlugs });

        // 4) Recalcul de l’index à partir des pages existantes
        // (On relist pour inclure la page créée. Optimisation possible ensuite.)
        const summaries = await pagesRepo.list(WRITE_CONTENT_STATE);

        lg.debug("route.index.rebuild.input", {
          summariesCount: summaries.length,
          createdPageId: page.id,
          createdSlug: page.slug,
        });

        const index: SiteIndexDTO = {
          pages: summaries.map((p) => ({
            id: p.id,
            slug: p.slug,
            title: p.title,
            parentId: p.parentId,
          })),
          updatedAt: new Date().toISOString(),
        };

        await siteRepo.writeIndex(WRITE_CONTENT_STATE, index);

        try {
          lg.info?.("route.statusCache.invalidateAll.start", {});
          await statusCache.invalidateAll();
          lg.info?.("route.statusCache.invalidateAll.done", {});
        } catch (e) {
          lg.error?.("route.statusCache.invalidateAll.failed", {
            err: String(e),
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
