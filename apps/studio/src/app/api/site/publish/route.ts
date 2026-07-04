/**
 * @file apps/studio/src/app/api/site/publish/route.ts
 * @layer studio/app/api
 *
 * @description
 * Route API Studio pour publier le Website actif.
 *
 * @remarks
 * Responsabilités :
 * - POST : déclenche la publication du Website actif.
 * - Body optionnel : { from?, to?, cleanOrphans? }.
 * - Query optionnelle : ?from=…&to=… ; le body a priorité.
 * - Résolution des states : body > query > défaut.
 * - Appel du use-case `publishSite` pour la logique métier :
 *   copie index, settings, pages et warnings.
 * - Invalidation best-effort du cache status/statusDetails.
 * - Déclenche une revalidation ISR des routes publiques après publication.
 *
 * Notes de scope :
 * - Les repositories Studio sont scopés par Prisma Website.id.
 * - La revalidation publique utilise Website.slug pour les routes `/t/:websiteSlug`.
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

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function parseStatesFromQuery(req: Request): {
  from?: ContentState;
  to?: ContentState;
} {
  const url = new URL(req.url);
  const qsFrom = url.searchParams.get("from");
  const qsTo = url.searchParams.get("to");

  const isState = (value: string | null): value is ContentState =>
    value === CONTENT_STATE.DRAFT || value === CONTENT_STATE.PUBLISHED;

  return {
    from: isState(qsFrom) ? qsFrom : undefined,
    to: isState(qsTo) ? qsTo : undefined,
  };
}

/**
 * Résout un ContentState à partir des sources :
 * body > query > fallback.
 *
 * - `undefined` => fallback.
 * - valeur invalide => 422 validation_error.
 */
function resolveStateOr422(args: {
  value: unknown;
  fallback: ContentState;
  where: string;
}): ContentState {
  const value = args.value ?? args.fallback;

  if (value === CONTENT_STATE.DRAFT || value === CONTENT_STATE.PUBLISHED) {
    return value;
  }

  throwHttp(422, {
    code: EC.VALIDATION_ERROR,
    message: EC.CONTENT_STATE_INVALID,
    extras: {
      where: args.where,
      value: typeof value === "string" ? value : String(value),
      allowed: [CONTENT_STATE.DRAFT, CONTENT_STATE.PUBLISHED],
    },
  });
}

async function revalidatePublicAfterPublish(params: {
  siteBaseUrl?: string;
  websiteSlug: string;
  slugs: ReadonlyArray<string>;
}) {
  const baseUrl = String(
    params.siteBaseUrl ?? process.env["NEXT_PUBLIC_SITE_ORIGIN"] ?? "",
  ).trim();

  /**
   * Si l’origine publique n’est pas configurée, la publication reste valide.
   * La revalidation publique est best-effort.
   */
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
        websiteSlug: params.websiteSlug,
        slugs: params.slugs,
      }),
    });

    if (!res.ok) {
      throw new Error(`public_revalidate_failed:${res.status}`);
    }
  } catch (error) {
    log.warn?.("publish.revalidate.public.failed", {
      err: error instanceof Error ? error.message : String(error),
      baseUrl,
      websiteSlug: params.websiteSlug,
    });
  }
}

/* -------------------------------------------------------------------------- */
/* POST                                                                       */
/* -------------------------------------------------------------------------- */

export async function POST(req: Request) {
  const NS = "api.studio.site.publish.POST" as const;

  return handleRoute(NS, req, async () => {
    const { websiteId, websiteSlug } = await requireNonDemoSession();

    return logSpan(
      NS,
      {
        ns: NS,
        method: "POST",
        websiteId,
        websiteSlug,
        contentTypeHeader: req.headers.get("content-type") ?? undefined,
      },
      async () => {
        const logger = log.child({ ns: NS });

        const qs = parseStatesFromQuery(req);
        const raw = await readJsonOptionalOrEmpty(req);

        const dto: PublishSiteIntentDTO = parseDTOOrHttp(
          PublishSiteIntentSchema,
          raw,
          {
            message: EC.VALIDATION_ERROR,
            extras: { where: "api.studio.site.publish.POST.payload" },
          },
        );

        const isProd = process.env.NODE_ENV === "production";

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
          site: getSiteRepository({ websiteId }),
          pages: getPagesRepository({ websiteId }),
          runtime: { isProd },
          revalidator: {
            async revalidatePublished({ slugs }) {
              await revalidatePublicAfterPublish({
                websiteSlug,
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

        logger.debug?.("publish.metrics", {
          websiteId,
          websiteSlug,
          from: result.from,
          to: result.to,
          pagesCopied: result.pagesCopied,
          settingsCopied: result.settingsCopied,
          warnings: result.warnings.length,
        });

        /**
         * Invalidation du cache de status du Website actif.
         *
         * Le cache peut encore être implémenté en KV côté infra,
         * mais son scope métier est le Prisma Website.id.
         */
        const statusCache = getSiteStatusCache({ websiteId });

        try {
          logger.debug?.("route.statusCache.invalidateAll.start", {
            websiteId,
          });

          await statusCache.invalidateAll();

          logger.debug?.("route.statusCache.invalidateAll.done", {
            websiteId,
          });
        } catch (error) {
          logger.error?.("route.statusCache.invalidateAll.failed", {
            websiteId,
            err: String(error),
          });
        }

        const res: PublishSiteResponse = {
          publishResult: result,
        };

        return res;
      },
    );
  });
}
