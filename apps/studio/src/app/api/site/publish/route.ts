/**
 * @file apps/studio/src/app/api/site/publish/route.ts
 * @layer api/routes
 * @description
 * Route API Admin pour publier le site (copie d’un state vers un autre).
 *
 * Responsabilités :
 * - POST : déclenche la publication du site.
 * - Body optionnel : { from?, to?, cleanOrphans? }.
 * - Query optionnelle : ?from=…&to=… (le body a priorité).
 * - Résolution des states : body > query > défaut.
 * - Appel du use-case `publishSite` pour la logique métier (copie index, settings, pages, warnings).
 * - Invalidation best-effort des snapshots status/statusDetails (route-level).
 *
 * @remarks
 * - En V0.5, on déclenche une revalidation ISR des routes publiques après publication.
 */

import { revalidatePath } from "next/cache";

import {
  CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { publishSite } from "@compoz/core/domain/site/use-cases/publish/publish-site";
import { throwHttp } from "@compoz/http/http-error";
import { readJsonOptionalOrEmpty } from "@compoz/infra/http/read-json";
import type { PublishSiteResponse } from "@compoz/infra/http/studio/site.types";
import { log, logSpan } from "@compoz/infra/lib/log";
import { getPagesRepository } from "@compoz/infra/pages";
import { getSiteRepository, getSiteStatusCache } from "@compoz/infra/site";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";

import {
  PublishSiteIntentSchema,
  type PublishSiteIntentDTO,
} from "@compoz/validation/site/publish/publish-intents";

function parseStatesFromQuery(req: Request): {
  from?: ContentState;
  to?: ContentState;
} {
  const url = new URL(req.url);
  const qsFrom = url.searchParams.get("from");
  const qsTo = url.searchParams.get("to");

  const isState = (v: string | null): v is ContentState =>
    v === CONTENT_STATE.DRAFT || v === CONTENT_STATE.PUBLISHED;

  return {
    from: isState(qsFrom) ? qsFrom : undefined,
    to: isState(qsTo) ? qsTo : undefined,
  };
}

/**
 * Résout un ContentState à partir des sources (priorité : body > query > fallback).
 * - `undefined` => fallback
 * - valeur invalide => 422 (validation_error)
 */
function resolveStateOr422(args: {
  value: unknown;
  fallback: ContentState;
  where: string;
}): ContentState {
  const v = args.value ?? args.fallback;

  if (v === CONTENT_STATE.DRAFT || v === CONTENT_STATE.PUBLISHED) {
    return v;
  }

  throwHttp(422, {
    code: EC.VALIDATION_ERROR,
    message: EC.CONTENT_STATE_INVALID,
    extras: {
      where: args.where,
      value: typeof v === "string" ? v : String(v),
      allowed: [CONTENT_STATE.DRAFT, CONTENT_STATE.PUBLISHED],
    },
  });
}

async function revalidatePublicAfterPublish(params: {
  slugs: ReadonlyArray<string>;
}) {
  revalidatePath("/site");

  for (const slug of params.slugs) {
    const s = String(slug ?? "").trim();
    if (!s || s === "home") continue;
    revalidatePath(`/site/${s}`);
  }

  revalidatePath("/sitemap.xml");
}

export async function POST(req: Request) {
  const NS = "api.admin.site.publish.POST" as const;

  return handleRoute(NS, req, async () => {
    return logSpan(
      NS,
      {
        ns: NS,
        method: "POST",
        contentTypeHeader: req.headers.get("content-type") ?? undefined,
      },
      async () => {
        const lg = log.child({ ns: NS });

        const qs = parseStatesFromQuery(req);
        const raw = await readJsonOptionalOrEmpty(req);

        // ✅ DTO Zod (unchanged)
        // Note: on garde ta validation Zod + erreurs normalisées.
        const dto: PublishSiteIntentDTO = parseDTOOrHttp(
          PublishSiteIntentSchema,
          raw,
          {
            message: EC.VALIDATION_ERROR,
            extras: { where: "api.admin.site.publish.POST.payload" },
          },
        );

        // ✅ Body > Query > defaults, sans resolveContentStateOrHttp
        const from = resolveStateOr422({
          value: dto.from,
          fallback: qs.from ?? CONTENT_STATE.DRAFT,
          where: "api.admin.site.publish.POST.from",
        });

        const to = resolveStateOr422({
          value: dto.to,
          fallback: qs.to ?? CONTENT_STATE.PUBLISHED,
          where: "api.admin.site.publish.POST.to",
        });

        const run = publishSite({
          site: getSiteRepository(),
          pages: getPagesRepository(),
          revalidator: {
            async revalidatePublished({ slugs }) {
              await revalidatePublicAfterPublish({ slugs });
            },
          },
        });

        const result = await run({
          from,
          to,
          cleanOrphans: dto.cleanOrphans,
        });

        lg.info("publish.metrics", {
          from: result.from,
          to: result.to,
          pagesCopied: result.pagesCopied,
          settingsCopied: result.settingsCopied,
          warnings: result.warnings.length,
        });

        // ✅ Invalidation snapshots (route-level, best-effort)
        const statusCache = getSiteStatusCache();
        try {
          lg.info?.("route.statusCache.invalidateAll.start", {});
          await statusCache.invalidateAll();
          lg.info?.("route.statusCache.invalidateAll.done", {});
        } catch (e) {
          lg.error?.("route.statusCache.invalidateAll.failed", {
            err: String(e),
          });
        }

        const res: PublishSiteResponse = { publishResult: result };
        return res;
      },
    );
  });
}
