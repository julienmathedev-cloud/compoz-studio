/**
 * @file apps/studio/src/app/api/site/publish/route.ts
 * @layer studio/app/api
 *
 * @description
 * Studio API route for publishing the active Website.
 *
 * @remarks
 * - Resolves publish states from body, query, then defaults.
 * - Runs `publishSite` through the specialized Prisma transaction boundary.
 * - Invalidates status caches and triggers public revalidation after commit.
 * - Studio repositories are scoped by Prisma Website.id.
 * - Public revalidation uses Website.slug for `/t/:websiteSlug` routes.
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
import {
  getPublishSiteTransaction,
  getSiteStatusCache,
} from "@compoz/infra/site";
import { requireNonDemoSession } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import {
  PublishSiteIntentSchema,
  type PublishSiteIntentDTO,
} from "@compoz/validation/site/publish/publish-intents";
import { publishAndInvalidateStatusCache } from "@compoz/studio/app/api/site/publish/invalidate-publish-status-cache";

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
 * Resolves a `ContentState` from body, query, or fallback values.
 *
 * - `undefined` falls back to the provided default.
 * - Invalid values produce a 422 validation error.
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
   * Publishing remains valid when the public origin is not configured.
   * Public revalidation is best-effort.
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
      baseUrl,
      websiteSlug: params.websiteSlug,
    });
    throw error;
  }
}

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
          transaction: getPublishSiteTransaction({ websiteId }),
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

        /**
         * Invalidates the active Website status cache.
         *
         * The cache may still be backed by KV in infra, but its business scope is
         * the Prisma Website.id.
         */
        const statusCache = getSiteStatusCache({ websiteId });

        const { result, cacheInvalidated } =
          await publishAndInvalidateStatusCache({
            websiteId,
            publish: () =>
              run({
                from,
                to,
                cleanOrphans: dto.cleanOrphans,
              }),
            statusCache,
            logger,
          });

        logger.debug?.("publish.metrics", {
          websiteId,
          websiteSlug,
          from: result.from,
          to: result.to,
          pagesCopied: result.pagesCopied,
          settingsCopied: result.settingsCopied,
          warnings: result.warnings.length,
          cacheInvalidated,
        });

        const res: PublishSiteResponse = {
          publishResult: result,
        };

        return res;
      },
    );
  });
}
