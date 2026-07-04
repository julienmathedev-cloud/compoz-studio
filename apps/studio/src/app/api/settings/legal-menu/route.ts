/**
 * @file apps/studio/src/app/api/settings/legal-menu/route.ts
 * @layer studio/app/api
 *
 * @description
 * Route API Studio pour la lecture et la mise à jour du menu légal
 * du Website actif.
 *
 * @remarks
 * Responsabilités :
 * - GET   : retourne les settings LegalMenu selon le state demandé.
 * - PATCH : met à jour les settings LegalMenu en draft via un DTO intent,
 *   adaptation en patch domaine, puis exécution du use-case
 *   `updateLegalMenuSettings`.
 * - Le repository merge avec les defaults pour assurer la cohérence.
 * - Le repository et le cache de status sont scopés par Prisma Website.id.
 */

import "server-only";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { updateLegalMenuSettings } from "@compoz/core/domain/site/use-cases/legal-menu/update-legal-menu-settings";
import { readJsonOr400 } from "@compoz/infra/http/read-json";
import type {
  GetLegalMenuResponse,
  PatchLegalMenuResponse,
} from "@compoz/infra/http/studio/site-settings.types";
import { log, logSpan } from "@compoz/infra/lib/log";
import { getSiteRepository, getSiteStatusCache } from "@compoz/infra/site";
import { adaptUpdateLegalMenuIntent } from "@compoz/studio/app/api/_adapters/menus";
import { requireSessionWithWebsite } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import { UpdateLegalMenuSettingsIntentSchema } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu-intents";

/* -------------------------------------------------------------------------- */
/* GET                                                                        */
/* -------------------------------------------------------------------------- */

export async function GET(req: Request) {
  const NS = "api.studio.site.legalMenu.GET" as const;

  return handleRoute(NS, req, async ({ state }) => {
    const { websiteId } = await requireSessionWithWebsite();

    return logSpan(
      NS,
      { ns: NS, method: "GET", state, websiteId },
      async () => {
        const repo = getSiteRepository({ websiteId });
        const settings = await repo.readSettings(state);

        const res: GetLegalMenuResponse = {
          settings: settings.legalMenu,
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
  const NS = "api.studio.site.legalMenu.PATCH" as const;

  return handleRoute(NS, req, async () => {
    const { websiteId } = await requireSessionWithWebsite();

    return logSpan(NS, { ns: NS, method: "PATCH", websiteId }, async () => {
      const logger = log.child({ ns: NS });

      const raw = await readJsonOr400(req);

      logger.debug?.("route.legalMenu.patch.start", {
        websiteId,
        hasBody: raw != null,
        bodyKeys: raw && typeof raw === "object" ? Object.keys(raw) : [],
      });

      const dto = parseDTOOrHttp(UpdateLegalMenuSettingsIntentSchema, raw, {
        message: EC.VALIDATION_ERROR,
        extras: { where: "api.studio.site.legalMenu.PATCH.payload" },
      });

      const input = adaptUpdateLegalMenuIntent(dto);

      const repo = getSiteRepository({ websiteId });
      const statusCache = getSiteStatusCache({ websiteId });

      const run = updateLegalMenuSettings({ repo });
      const { settings } = await run(input);

      logger.debug?.("route.legalMenu.patch.afterWrite", {
        websiteId,
        legalMenuKeys: settings.legalMenu
          ? Object.keys(settings.legalMenu)
          : [],
      });

      /**
       * Invalidation du cache de status du Website actif.
       *
       * Le cache peut encore être implémenté en KV côté infra,
       * mais son scope métier est le Prisma Website.id.
       */
      try {
        logger.debug?.("route.legalMenu.patch.invalidate.start", {
          websiteId,
          invalidateStatus: true,
        });

        await statusCache.invalidateStatus();

        logger.debug?.("route.legalMenu.patch.invalidate.done", {
          websiteId,
          invalidateStatus: true,
        });
      } catch (error) {
        logger.error?.("route.legalMenu.patch.invalidate.failed", {
          websiteId,
          err: String(error),
          invalidateStatus: true,
        });
      }

      const res: PatchLegalMenuResponse = {
        settings: settings.legalMenu,
      };

      return res;
    });
  });
}
