/**
 * @file apps/studio/src/app/api/settings/footer/route.ts
 * @layer studio/app/api
 *
 * @description
 * Route API Studio pour la lecture et la mise à jour des settings Footer
 * du Website actif.
 *
 * @remarks
 * Responsabilités :
 * - GET   : retourne les settings Footer selon le state demandé.
 * - PATCH : met à jour les settings Footer en draft via un DTO intent,
 *   adaptation en patch domaine, puis exécution du use-case
 *   `updateFooterSettings`.
 * - Le repository gère le merge avec les defaults pour assurer
 *   la cohérence du footer.
 * - Le repository et le cache de status sont scopés par Prisma Website.id.
 */

import "server-only";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { updateFooterSettings } from "@compoz/core/domain/site/use-cases/footer/update-footer-settings";
import { readJsonOr400 } from "@compoz/infra/http/read-json";
import type {
  GetFooterResponse,
  PatchFooterResponse,
} from "@compoz/infra/http/studio/site-settings.types";
import { log, logSpan } from "@compoz/infra/lib/log";
import { getSiteRepository, getSiteStatusCache } from "@compoz/infra/site";
import { adaptUpdateFooterIntent } from "@compoz/studio/app/api/_adapters/footer";
import { requireSessionWithWebsite } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import { UpdateFooterSettingsIntentSchema } from "@compoz/validation/site/settings/footer/footer-intents";

/* -------------------------------------------------------------------------- */
/* GET                                                                        */
/* -------------------------------------------------------------------------- */

export async function GET(req: Request) {
  const NS = "api.studio.site.footer.GET" as const;

  return handleRoute(NS, req, async ({ state }) => {
    const { websiteId } = await requireSessionWithWebsite();

    return logSpan(
      NS,
      { ns: NS, method: "GET", state, websiteId },
      async () => {
        const repo = getSiteRepository({ websiteId });
        const settings = await repo.readSettings(state);

        const res: GetFooterResponse = {
          settings: settings.footer,
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
  const NS = "api.studio.site.footer.PATCH" as const;

  return handleRoute(NS, req, async () => {
    const { websiteId } = await requireSessionWithWebsite();

    return logSpan(NS, { ns: NS, method: "PATCH", websiteId }, async () => {
      const logger = log.child({ ns: NS });

      const raw = await readJsonOr400(req);

      logger.debug?.("route.footer.patch.start", {
        websiteId,
        hasBody: raw != null,
        bodyKeys: raw && typeof raw === "object" ? Object.keys(raw) : [],
      });

      const dto = parseDTOOrHttp(UpdateFooterSettingsIntentSchema, raw, {
        message: EC.VALIDATION_ERROR,
        extras: { where: "api.studio.site.footer.PATCH.payload" },
      });

      const input = adaptUpdateFooterIntent(dto);

      const repo = getSiteRepository({ websiteId });
      const statusCache = getSiteStatusCache({ websiteId });

      const run = updateFooterSettings({ repo });
      const { settings } = await run(input);

      logger.debug?.("route.footer.patch.afterWrite", {
        websiteId,
        footerKeys: settings.footer ? Object.keys(settings.footer) : [],
      });

      /**
       * Invalidation du cache de status du Website actif.
       *
       * Le cache peut encore être implémenté en KV côté infra,
       * mais son scope métier est le Prisma Website.id.
       */
      try {
        logger.debug?.("route.footer.patch.invalidate.start", {
          websiteId,
          invalidateStatus: true,
        });

        await statusCache.invalidateStatus();

        logger.debug?.("route.footer.patch.invalidate.done", {
          websiteId,
          invalidateStatus: true,
        });
      } catch (error) {
        logger.error?.("route.footer.patch.invalidate.failed", {
          websiteId,
          err: String(error),
          invalidateStatus: true,
        });
      }

      const res: PatchFooterResponse = {
        settings: settings.footer,
      };

      return res;
    });
  });
}
