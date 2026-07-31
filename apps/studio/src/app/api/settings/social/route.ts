/**
 * @file apps/studio/src/app/api/settings/social/route.ts
 * @layer studio/app/api
 *
 * @description
 * Studio API route for reading and updating the active Website social settings.
 *
 * @remarks
 * - `PATCH` adapts the update intent into a domain patch before running the use case.
 * - The repository merges with defaults to keep social settings consistent.
 * - The repository and status cache are scoped by Prisma Website.id.
 */

import "server-only";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { updateSocialSettings } from "@compoz/core/domain/site/use-cases/social/update-social-settings";
import { readJsonOr400 } from "@compoz/infra/http/read-json";
import type {
  GetSocialResponse,
  PatchSocialResponse,
} from "@compoz/infra/http/studio/site-settings.types";
import { log, logSpan } from "@compoz/infra/lib/log";
import { getSiteRepository, getSiteStatusCache } from "@compoz/infra/site";
import { adaptUpdateSocialIntent } from "@compoz/studio/app/api/_adapters/social";
import { invalidateUpdatedSettingsStatus } from "@compoz/studio/app/api/settings/invalidate-settings-status";
import { requireSessionWithWebsite } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import { UpdateSocialSettingsIntentSchema } from "@compoz/validation/site/settings/social/social-intents";

export async function GET(req: Request) {
  const NS = "api.studio.site.social.GET" as const;

  return handleRoute(NS, req, async ({ state }) => {
    const { websiteId } = await requireSessionWithWebsite();

    return logSpan(
      NS,
      { ns: NS, method: "GET", state, websiteId },
      async () => {
        const repo = getSiteRepository({ websiteId });
        const bundle = await repo.readSettingsWithRevisions(state);

        const res: GetSocialResponse = {
          settings: bundle.settings.social,
          revision: bundle.revisions.socialRevision,
        };

        return res;
      },
    );
  });
}

export async function PATCH(req: Request) {
  const NS = "api.studio.site.social.PATCH" as const;

  return handleRoute(NS, req, async () => {
    const { websiteId } = await requireSessionWithWebsite();

    return logSpan(NS, { ns: NS, method: "PATCH", websiteId }, async () => {
      const logger = log.child({ ns: NS });

      const raw = await readJsonOr400(req);

      logger.debug?.("route.social.patch.start", {
        websiteId,
        hasBody: raw != null,
        bodyKeys: raw && typeof raw === "object" ? Object.keys(raw) : [],
      });

      const dto = parseDTOOrHttp(UpdateSocialSettingsIntentSchema, raw, {
        message: EC.VALIDATION_ERROR,
        extras: { where: "api.studio.site.social.PATCH.payload" },
      });

      const input = adaptUpdateSocialIntent(dto);

      const repo = getSiteRepository({ websiteId });
      const statusCache = getSiteStatusCache({ websiteId });

      const run = updateSocialSettings({ repo });
      const { settings, revision, outcome } = await run(input);

      logger.debug?.("route.social.patch.afterWrite", {
        websiteId,
        socialKeys: Object.keys(settings),
      });

      await invalidateUpdatedSettingsStatus({ websiteId, outcome, statusCache, logger });

      const res: PatchSocialResponse = {
        settings,
        revision,
        outcome,
      };

      return res;
    });
  });
}
