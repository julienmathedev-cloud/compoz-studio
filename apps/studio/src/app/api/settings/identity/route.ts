/**
 * @file apps/studio/src/app/api/settings/identity/route.ts
 * @layer studio/app/api
 *
 * @description
 * Studio API route for reading and updating the active Website identity settings.
 *
 * @remarks
 * - `PATCH` adapts the update intent into a domain patch before running the use case.
 * - The repository merges with defaults to keep identity settings consistent.
 * - The repository and status cache are scoped by Prisma Website.id.
 */

import "server-only";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { updateIdentitySettings } from "@compoz/core/domain/site/use-cases/identity/update-identity-settings";
import { readJsonOr400 } from "@compoz/infra/http/read-json";
import type {
  GetIdentityResponse,
  PatchIdentityResponse,
} from "@compoz/infra/http/studio/site-settings.types";
import { log, logSpan } from "@compoz/infra/lib/log";
import { getSiteRepository, getSiteStatusCache } from "@compoz/infra/site";
import { adaptUpdateIdentityIntent } from "@compoz/studio/app/api/_adapters/identity";
import { requireSessionWithWebsite } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import { UpdateIdentitySettingsIntentSchema } from "@compoz/validation/site/settings/identity/identity-intents";

export async function GET(req: Request) {
  const NS = "api.studio.site.identity.GET" as const;

  return handleRoute(NS, req, async ({ state }) => {
    const { websiteId } = await requireSessionWithWebsite();

    return logSpan(
      NS,
      { ns: NS, method: "GET", state, websiteId },
      async () => {
        const repo = getSiteRepository({ websiteId });
        const settings = await repo.readSettings(state);

        const res: GetIdentityResponse = {
          settings: settings.identity,
        };

        return res;
      },
    );
  });
}

export async function PATCH(req: Request) {
  const NS = "api.studio.site.identity.PATCH" as const;

  return handleRoute(NS, req, async () => {
    const { websiteId } = await requireSessionWithWebsite();

    return logSpan(NS, { ns: NS, method: "PATCH", websiteId }, async () => {
      const logger = log.child({ ns: NS });

      const raw = await readJsonOr400(req);

      logger.debug?.("route.identity.patch.start", {
        websiteId,
        hasBody: raw != null,
        bodyKeys: raw && typeof raw === "object" ? Object.keys(raw) : [],
      });

      const dto = parseDTOOrHttp(UpdateIdentitySettingsIntentSchema, raw, {
        message: EC.VALIDATION_ERROR,
        extras: { where: "api.studio.site.identity.PATCH.payload" },
      });

      const input = adaptUpdateIdentityIntent(dto);

      const repo = getSiteRepository({ websiteId });
      const statusCache = getSiteStatusCache({ websiteId });

      const run = updateIdentitySettings({ repo });
      const { settings } = await run(input);

      logger.debug?.("route.identity.patch.afterWrite", {
        websiteId,
        identityKeys: settings.identity ? Object.keys(settings.identity) : [],
      });

      /**
       * Invalidates the active Website status cache.
       *
       * The cache may still be backed by KV in infra, but its business scope is
       * the Prisma Website.id.
       */
      try {
        logger.debug?.("route.identity.patch.invalidate.start", {
          websiteId,
          invalidateStatus: true,
        });

        await statusCache.invalidateStatus();

        logger.debug?.("route.identity.patch.invalidate.done", {
          websiteId,
          invalidateStatus: true,
        });
      } catch (error) {
        logger.error?.("route.identity.patch.invalidate.failed", {
          websiteId,
          err: String(error),
          invalidateStatus: true,
        });
      }

      const res: PatchIdentityResponse = {
        settings: settings.identity,
      };

      return res;
    });
  });
}
