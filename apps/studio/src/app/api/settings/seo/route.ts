/**
 * @file apps/studio/src/app/api/settings/seo/route.ts
 * @layer studio/app/api
 *
 * @description
 * Route API Studio pour la lecture et la mise à jour des réglages SEO
 * du Website actif.
 *
 * @remarks
 * Responsabilités :
 * - GET   : retourne les settings SEO selon le state demandé.
 * - PATCH : met à jour les settings SEO en draft via un DTO intent,
 *   adaptation en patch domaine, puis exécution du use-case
 *   `updateSeoSettings`.
 * - Le repository merge avec les defaults pour assurer la cohérence.
 * - Le repository et le cache de status sont scopés par Prisma Website.id.
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

/* -------------------------------------------------------------------------- */
/* GET                                                                        */
/* -------------------------------------------------------------------------- */

export async function GET(req: Request) {
  const NS = "api.studio.site.seo.GET" as const;

  return handleRoute(NS, req, async ({ state }) => {
    const { websiteId } = await requireSessionWithWebsite();

    return logSpan(
      NS,
      { ns: NS, method: "GET", state, websiteId },
      async () => {
        const repo = getSiteRepository({ websiteId });
        const settings = await repo.readSettings(state);

        const res: GetSeoResponse = {
          settings: settings.seo,
        };

        return res;
      },
    );
  });
}

/* -------------------------------------------------------------------------- */
/* PATCH                                                                      */
/* -------------------------------------------------------------------------- */

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
      const { settings } = await run(input);

      logger.debug?.("route.seo.patch.afterWrite", {
        websiteId,
        seoKeys: settings.seo ? Object.keys(settings.seo) : [],
      });

      /**
       * Invalidation du cache de status du Website actif.
       *
       * Le cache peut encore être implémenté en KV côté infra,
       * mais son scope métier est le Prisma Website.id.
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
        settings: settings.seo,
      };

      return res;
    });
  });
}
