/**
 * @file apps/studio/src/app/api/settings/header/route.ts
 * @layer studio/app/api
 *
 * @description
 * Studio API route for reading and updating the active Website header settings.
 *
 * @remarks
 * - `PATCH` adapts the update intent into a domain patch before running the use case.
 * - The repository merges persisted settings with defaults to keep the header consistent.
 * - The repository and status cache are scoped by Prisma Website.id.
 */

import "server-only";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { updateHeaderSettings } from "@compoz/core/domain/site/use-cases/header/update-header-settings";
import { readJsonOr400 } from "@compoz/infra/http/read-json";
import type {
  GetHeaderResponse,
  PatchHeaderResponse,
} from "@compoz/infra/http/studio/site-settings.types";
import { log, logSpan } from "@compoz/infra/lib/log";
import { getSiteRepository, getSiteStatusCache } from "@compoz/infra/site";
import { adaptUpdateHeaderIntent } from "@compoz/studio/app/api/_adapters/header";
import { requireSessionWithWebsite } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import { UpdateHeaderSettingsIntentSchema } from "@compoz/validation/site/settings/header/header-intents";

export async function GET(req: Request) {
  const NS = "api.studio.site.header.GET" as const;

  return handleRoute(NS, req, async ({ state }) => {
    const { websiteId } = await requireSessionWithWebsite();

    return logSpan(
      NS,
      { ns: NS, method: "GET", state, websiteId },
      async () => {
        const repo = getSiteRepository({ websiteId });
        const settings = await repo.readSettings(state);

        const res: GetHeaderResponse = {
          settings: settings.header,
        };

        return res;
      },
    );
  });
}

export async function PATCH(req: Request) {
  const NS = "api.studio.site.header.PATCH" as const;

  return handleRoute(NS, req, async () => {
    const { websiteId } = await requireSessionWithWebsite();

    return logSpan(NS, { ns: NS, method: "PATCH", websiteId }, async () => {
      const logger = log.child({ ns: NS });

      const raw = await readJsonOr400(req);

      logger.debug?.("route.header.patch.start", {
        websiteId,
        hasBody: raw != null,
        bodyKeys: raw && typeof raw === "object" ? Object.keys(raw) : [],
      });

      const dto = parseDTOOrHttp(UpdateHeaderSettingsIntentSchema, raw, {
        message: EC.VALIDATION_ERROR,
        extras: { where: "api.studio.site.header.PATCH.payload" },
      });

      const input = adaptUpdateHeaderIntent(dto);

      const repo = getSiteRepository({ websiteId });
      const statusCache = getSiteStatusCache({ websiteId });

      const run = updateHeaderSettings({ repo });
      const { settings } = await run(input);

      logger.debug?.("route.header.patch.afterWrite", {
        websiteId,
        headerKeys: settings.header ? Object.keys(settings.header) : [],
      });

      /**
       * Invalidates the active Website status cache.
       *
       * The cache may still be backed by KV in infra, but its business scope is
       * the Prisma Website.id.
       */
      try {
        logger.debug?.("route.header.patch.invalidate.start", {
          websiteId,
          invalidateStatus: true,
        });

        await statusCache.invalidateStatus();

        logger.debug?.("route.header.patch.invalidate.done", {
          websiteId,
          invalidateStatus: true,
        });
      } catch (error) {
        logger.error?.("route.header.patch.invalidate.failed", {
          websiteId,
          err: String(error),
          invalidateStatus: true,
        });
      }

      const res: PatchHeaderResponse = {
        settings: settings.header,
      };

      return res;
    });
  });
}
