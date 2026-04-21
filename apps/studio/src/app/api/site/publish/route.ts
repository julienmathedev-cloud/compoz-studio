/**
 * @file apps/studio/src/app/api/site/publish/route.ts
 * @layer studio/app/api
 * @description
 * Route API Studio pour publier le site (copie d’un state vers un autre).
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

import "server-only";

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
import { requireNonDemoSession } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
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
  siteBaseUrl?: string; // ex: http://localhost:3001
  tenantId: string;
  slugs: ReadonlyArray<string>;
}) {
  const baseUrl = String(
    params.siteBaseUrl ?? process.env["NEXT_PUBLIC_SITE_ORIGIN"] ?? "",
  ).trim();

  // Si pas configuré : no-op (mais publication OK)
  if (!baseUrl) return;

  const secret = String(process.env["COMPOZ_REVALIDATE_SECRET"] ?? "").trim();

  try {
    const res = await fetch(`${baseUrl}/api/revalidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { "x-revalidate-secret": secret } : {}),
      },
      body: JSON.stringify({
        tenantId: params.tenantId,
        slugs: params.slugs,
      }),
    });

    if (!res.ok) {
      // best-effort : pas bloquant
      throw new Error(`public_revalidate_failed:${res.status}`);
    }
  } catch (e) {
    // best-effort : pas bloquant
    log.warn?.("publish.revalidate.public.failed", {
      err: e instanceof Error ? e.message : String(e),
      baseUrl,
      tenantId: params.tenantId,
    });
  }
}

export async function POST(req: Request) {
  const NS = "api.studio.site.publish.POST" as const;

  return handleRoute(NS, req, async () => {
    const { tenantId } = await requireNonDemoSession();

    return logSpan(
      NS,
      {
        ns: NS,
        method: "POST",
        tenantId,
        contentTypeHeader: req.headers.get("content-type") ?? undefined,
      },
      async () => {
        const lg = log.child({ ns: NS });

        const qs = parseStatesFromQuery(req);
        const raw = await readJsonOptionalOrEmpty(req);

        // ✅ DTO Zod (unchanged)
        const dto: PublishSiteIntentDTO = parseDTOOrHttp(
          PublishSiteIntentSchema,
          raw,
          {
            message: EC.VALIDATION_ERROR,
            extras: { where: "api.studio.site.publish.POST.payload" },
          },
        );

        const isProd = process.env.NODE_ENV === "production";

        // ✅ Body > Query > defaults
        const from = resolveStateOr422({
          value: dto.from,
          fallback: qs.from ?? CONTENT_STATE.DRAFT,
          where: "api.studio.site.publish.POST.from",
        });

        const to = resolveStateOr422({
          value: dto.to,
          fallback: qs.to ?? CONTENT_STATE.PUBLISHED,
          where: "api.studio.site.publish.POST.to",
        });

        const run = publishSite({
          site: getSiteRepository({ tenantId }),
          pages: getPagesRepository({ tenantId }),
          runtime: { isProd },
          revalidator: {
            async revalidatePublished({ slugs }) {
              await revalidatePublicAfterPublish({
                tenantId,
                slugs,
              });
            },
          },
        });

        const result = await run({
          from,
          to,
          cleanOrphans: dto.cleanOrphans,
        });

        lg.debug?.("publish.metrics", {
          tenantId,
          from: result.from,
          to: result.to,
          pagesCopied: result.pagesCopied,
          settingsCopied: result.settingsCopied,
          warnings: result.warnings.length,
        });

        // ✅ Invalidation snapshots (route-level, best-effort)
        const statusCache = getSiteStatusCache({ tenantId });
        try {
          lg.debug?.("route.statusCache.invalidateAll.start", {});
          await statusCache.invalidateAll();
          lg.debug?.("route.statusCache.invalidateAll.done", {});
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
