/**
 * @file apps/studio/src/app/api/settings/primary-menu/route.ts
 * @layer studio/app/api
 *
 * @description
 * Route API Studio pour la lecture et la mise à jour du menu principal
 * du Website actif.
 *
 * @remarks
 * Responsabilités :
 * - GET   : retourne les settings PrimaryMenu selon le state demandé.
 * - PATCH : met à jour les settings PrimaryMenu en draft via un DTO intent,
 *   adaptation en patch domaine, puis exécution du use-case
 *   `updatePrimaryMenuSettings`.
 * - Le repository merge avec les defaults pour assurer la cohérence.
 * - Le repository et le cache de status sont scopés par Prisma Website.id.
 */

import "server-only";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { updatePrimaryMenuSettings } from "@compoz/core/domain/site/use-cases/primary-menu/update-primary-menu-settings";
import { readJsonOr400 } from "@compoz/infra/http/read-json";
import type {
  GetPrimaryMenuResponse,
  PatchPrimaryMenuResponse,
} from "@compoz/infra/http/studio/site-settings.types";
import { log, logSpan } from "@compoz/infra/lib/log";
import { getSiteRepository, getSiteStatusCache } from "@compoz/infra/site";
import { adaptUpdatePrimaryMenuIntent } from "@compoz/studio/app/api/_adapters/menus";
import { requireSessionWithWebsite } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import { UpdatePrimaryMenuSettingsIntentSchema } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu-intents";

/* -------------------------------------------------------------------------- */
/* GET                                                                        */
/* -------------------------------------------------------------------------- */

export async function GET(req: Request) {
  const NS = "api.studio.site.primaryMenu.GET" as const;

  return handleRoute(NS, req, async ({ state }) => {
    const { websiteId } = await requireSessionWithWebsite();

    return logSpan(
      NS,
      { ns: NS, method: "GET", state, websiteId },
      async () => {
        const repo = getSiteRepository({ websiteId });
        const settings = await repo.readSettings(state);

        const res: GetPrimaryMenuResponse = {
          settings: settings.primaryMenu,
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
  const NS = "api.studio.site.primaryMenu.PATCH" as const;

  return handleRoute(NS, req, async () => {
    const { websiteId } = await requireSessionWithWebsite();

    return logSpan(NS, { ns: NS, method: "PATCH", websiteId }, async () => {
      const logger = log.child({ ns: NS });

      const raw = await readJsonOr400(req);

      logger.debug?.("route.primaryMenu.patch.start", {
        websiteId,
        hasBody: raw != null,
        bodyKeys: raw && typeof raw === "object" ? Object.keys(raw) : [],
      });

      const dto = parseDTOOrHttp(UpdatePrimaryMenuSettingsIntentSchema, raw, {
        message: EC.VALIDATION_ERROR,
        extras: { where: "api.studio.site.primaryMenu.PATCH.payload" },
      });

      const input = adaptUpdatePrimaryMenuIntent(dto);

      const repo = getSiteRepository({ websiteId });
      const statusCache = getSiteStatusCache({ websiteId });

      const run = updatePrimaryMenuSettings({ repo });
      const { settings } = await run(input);

      logger.debug?.("route.primaryMenu.patch.afterWrite", {
        websiteId,
        primaryMenuKeys: settings.primaryMenu
          ? Object.keys(settings.primaryMenu)
          : [],
      });

      /**
       * Invalidation du cache de status du Website actif.
       *
       * Le cache peut encore être implémenté en KV côté infra,
       * mais son scope métier est le Prisma Website.id.
       */
      try {
        logger.debug?.("route.primaryMenu.patch.invalidate.start", {
          websiteId,
          invalidateStatus: true,
        });

        await statusCache.invalidateStatus();

        logger.debug?.("route.primaryMenu.patch.invalidate.done", {
          websiteId,
          invalidateStatus: true,
        });
      } catch (error) {
        logger.error?.("route.primaryMenu.patch.invalidate.failed", {
          websiteId,
          err: String(error),
          invalidateStatus: true,
        });
      }

      const res: PatchPrimaryMenuResponse = {
        settings: settings.primaryMenu,
      };

      return res;
    });
  });
}
