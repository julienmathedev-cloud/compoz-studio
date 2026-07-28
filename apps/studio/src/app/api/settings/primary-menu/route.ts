/**
 * @file apps/studio/src/app/api/settings/primary-menu/route.ts
 * @layer studio/app/api
 *
 * @description
 * Studio API route for reading and updating the active Website primary menu settings.
 *
 * @remarks
 * - `PATCH` adapts the update intent into a domain patch before running the use case.
 * - The repository merges with defaults to keep primary menu settings consistent.
 * - The repository and status cache are scoped by Prisma Website.id.
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

export async function GET(req: Request) {
  const NS = "api.studio.site.primaryMenu.GET" as const;

  return handleRoute(NS, req, async ({ state }) => {
    const { websiteId } = await requireSessionWithWebsite();

    return logSpan(
      NS,
      { ns: NS, method: "GET", state, websiteId },
      async () => {
        const repo = getSiteRepository({ websiteId });
        const bundle = await repo.readSettingsWithRevisions(state);

        const res: GetPrimaryMenuResponse = {
          settings: bundle.settings.primaryMenu,
          revision: bundle.revisions.primaryMenuRevision,
        };

        return res;
      },
    );
  });
}

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
      const { settings, revision } = await run(input);

      logger.debug?.("route.primaryMenu.patch.afterWrite", {
        websiteId,
        primaryMenuKeys: Object.keys(settings),
      });

      /**
       * Invalidates the active Website status cache.
       *
       * The cache may still be backed by KV in infra, but its business scope is
       * the Prisma Website.id.
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
        settings,
        revision,
      };

      return res;
    });
  });
}
