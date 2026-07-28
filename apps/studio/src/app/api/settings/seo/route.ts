/**
 * @file apps/studio/src/app/api/settings/seo/route.ts
 * @layer studio/app/api
 *
 * @description
 * Studio API route for reading and updating the active Website SEO settings.
 *
 * @remarks
 * - `PATCH` adapts the update intent into a domain patch before running the use case.
 * - The repository merges with defaults to keep SEO settings consistent.
 * - The repository and status cache are scoped by Prisma Website.id.
 */

import "server-only";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { updateSeoSettings } from "@compoz/core/domain/site/use-cases/seo/update-seo-settings";
import { readJsonOr400 } from "@compoz/infra/http/read-json";
import type {
  GetSeoResponse,
  PatchSeoResponse,
} from "@compoz/infra/http/studio/site-settings.types";
import { log, logSpan } from "@compoz/infra/lib/log";
import { getSiteRepository, getSiteStatusCache } from "@compoz/infra/site";
import { adaptUpdateSeoIntent } from "@compoz/studio/app/api/_adapters/seo";
import { requireSessionWithWebsite } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import { createUpdateSeoSettingsIntentSchema } from "@compoz/validation/site/settings/seo/seo-intents";

export async function GET(req: Request) {
  const NS = "api.studio.site.seo.GET" as const;

  return handleRoute(NS, req, async ({ state }) => {
    const { websiteId } = await requireSessionWithWebsite();

    return logSpan(
      NS,
      { ns: NS, method: "GET", state, websiteId },
      async () => {
        const repo = getSiteRepository({ websiteId });
        const bundle = await repo.readSettingsWithRevisions(state);

        const res: GetSeoResponse = {
          settings: bundle.settings.seo,
          revision: bundle.revisions.seoRevision,
        };

        return res;
      },
    );
  });
}

export async function PATCH(req: Request) {
  const NS = "api.studio.site.seo.PATCH" as const;

  return handleRoute(NS, req, async () => {
    const { websiteId } = await requireSessionWithWebsite();

    return logSpan(NS, { ns: NS, method: "PATCH", websiteId }, async () => {
      const logger = log.child({ ns: NS });

      const raw = await readJsonOr400(req);

      logger.debug?.("route.seo.patch.start", {
        websiteId,
        hasBody: raw != null,
        bodyKeys: raw && typeof raw === "object" ? Object.keys(raw) : [],
      });

      const isProd = process.env.NODE_ENV === "production";

      const schema = createUpdateSeoSettingsIntentSchema({
        requireBaseUrlHttps: isProd,
      });

      const dto = parseDTOOrHttp(schema, raw, {
        message: EC.VALIDATION_ERROR,
        extras: { where: "api.studio.site.seo.PATCH.payload" },
      });

      const input = adaptUpdateSeoIntent(dto);

      const repo = getSiteRepository({ websiteId });
      const statusCache = getSiteStatusCache({ websiteId });

      const run = updateSeoSettings({ repo });
      const { settings, revision } = await run(input);

      logger.debug?.("route.seo.patch.afterWrite", {
        websiteId,
        seoKeys: Object.keys(settings),
      });

      /**
       * Invalidates the active Website status cache.
       *
       * The cache may still be backed by KV in infra, but its business scope is
       * the Prisma Website.id.
       */
      try {
        logger.debug?.("route.seo.patch.invalidate.start", {
          websiteId,
          invalidateStatus: true,
        });

        await statusCache.invalidateStatus();

        logger.debug?.("route.seo.patch.invalidate.done", {
          websiteId,
          invalidateStatus: true,
        });
      } catch (error) {
        logger.error?.("route.seo.patch.invalidate.failed", {
          websiteId,
          err: String(error),
          invalidateStatus: true,
        });
      }

      const res: PatchSeoResponse = {
        settings,
        revision,
      };

      return res;
    });
  });
}
