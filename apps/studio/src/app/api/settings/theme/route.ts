/**
 * @file apps/studio/src/app/api/settings/theme/route.ts
 * @layer studio/app/api
 *
 * @description
 * Studio API route for reading and updating the active Website theme settings.
 *
 * @remarks
 * - `PATCH` adapts the update intent into a domain patch before running the use case.
 * - The repository merges with defaults to keep theme settings consistent.
 * - The repository and status cache are scoped by Prisma Website.id.
 */

import "server-only";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { updateThemeSettings } from "@compoz/core/domain/site/use-cases/theme/update-theme-settings";
import { readJsonOr400 } from "@compoz/infra/http/read-json";
import type {
  GetThemeResponse,
  PatchThemeResponse,
} from "@compoz/infra/http/studio/site-settings.types";
import { log, logSpan } from "@compoz/infra/lib/log";
import { getSiteRepository, getSiteStatusCache } from "@compoz/infra/site";
import { adaptUpdateThemeIntent } from "@compoz/studio/app/api/_adapters/theme";
import { requireSessionWithWebsite } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import { UpdateThemeSettingsIntentSchema } from "@compoz/validation/site/settings/theme/theme-intents";

export async function GET(req: Request) {
  const NS = "api.studio.site.theme.GET" as const;

  return handleRoute(NS, req, async ({ state }) => {
    const { websiteId } = await requireSessionWithWebsite();

    return logSpan(
      NS,
      { ns: NS, method: "GET", state, websiteId },
      async () => {
        const repo = getSiteRepository({ websiteId });
        const bundle = await repo.readSettingsWithRevisions(state);

        const res: GetThemeResponse = {
          settings: bundle.settings.theme,
          revision: bundle.revisions.themeRevision,
        };

        return res;
      },
    );
  });
}

export async function PATCH(req: Request) {
  const NS = "api.studio.site.theme.PATCH" as const;

  return handleRoute(NS, req, async () => {
    const { websiteId } = await requireSessionWithWebsite();

    return logSpan(NS, { ns: NS, method: "PATCH", websiteId }, async () => {
      const logger = log.child({ ns: NS });

      const raw = await readJsonOr400(req);

      logger.debug?.("route.theme.patch.start", {
        websiteId,
        hasBody: raw != null,
        bodyKeys: raw && typeof raw === "object" ? Object.keys(raw) : [],
      });

      const dto = parseDTOOrHttp(UpdateThemeSettingsIntentSchema, raw, {
        message: EC.VALIDATION_ERROR,
        extras: { where: "api.studio.site.theme.PATCH.payload" },
      });

      const input = adaptUpdateThemeIntent(dto);

      const repo = getSiteRepository({ websiteId });
      const statusCache = getSiteStatusCache({ websiteId });

      const run = updateThemeSettings({ repo });
      const { settings, revision } = await run(input);

      logger.debug?.("route.theme.patch.afterWrite", {
        websiteId,
        themeKeys: Object.keys(settings),
      });

      /**
       * Invalidates the active Website status cache.
       *
       * The cache may still be backed by KV in infra, but its business scope is
       * the Prisma Website.id.
       */
      try {
        logger.debug?.("route.theme.patch.invalidate.start", {
          websiteId,
          invalidateStatus: true,
        });

        await statusCache.invalidateStatus();

        logger.debug?.("route.theme.patch.invalidate.done", {
          websiteId,
          invalidateStatus: true,
        });
      } catch (error) {
        logger.error?.("route.theme.patch.invalidate.failed", {
          websiteId,
          err: String(error),
          invalidateStatus: true,
        });
      }

      const res: PatchThemeResponse = {
        settings,
        revision,
      };

      return res;
    });
  });
}
