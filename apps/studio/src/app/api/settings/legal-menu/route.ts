/**
 * @file apps/studio/src/app/api/settings/legal-menu/route.ts
 * @layer studio/app/api
 *
 * @description
 * Studio API route for reading and updating the active Website legal menu.
 *
 * @remarks
 * - `PATCH` adapts the update intent into a domain patch before running the use case.
 * - The repository merges defaults to preserve consistency.
 * - The repository and status cache are scoped by Prisma Website.id.
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

export async function GET(req: Request) {
  const NS = "api.studio.site.legalMenu.GET" as const;

  return handleRoute(NS, req, async ({ state }) => {
    const { websiteId } = await requireSessionWithWebsite();

    return logSpan(
      NS,
      { ns: NS, method: "GET", state, websiteId },
      async () => {
        const repo = getSiteRepository({ websiteId });
        const bundle = await repo.readSettingsWithRevisions(state);

        const res: GetLegalMenuResponse = {
          settings: bundle.settings.legalMenu,
          revision: bundle.revisions.legalMenuRevision,
        };

        return res;
      },
    );
  });
}

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
      const { settings, revision } = await run(input);

      logger.debug?.("route.legalMenu.patch.afterWrite", {
        websiteId,
        legalMenuKeys: Object.keys(settings),
      });

      /**
       * Invalidates the active Website status cache.
       *
       * The cache may still be backed by KV in infra, but its business scope is
       * the Prisma Website.id.
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
        settings,
        revision,
      };

      return res;
    });
  });
}
