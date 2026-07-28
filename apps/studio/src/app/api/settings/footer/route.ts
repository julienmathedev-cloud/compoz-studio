/**
 * @file apps/studio/src/app/api/settings/footer/route.ts
 * @layer studio/app/api
 *
 * @description
 * Studio API route for reading and updating the active Website footer settings.
 *
 * @remarks
 * - `PATCH` adapts the update intent into a domain patch before running the use case.
 * - `GET` and `PATCH` return the footer together with its coherent revision.
 * - The repository and status cache are scoped by Prisma Website.id.
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

export async function GET(req: Request) {
  const NS = "api.studio.site.footer.GET" as const;

  return handleRoute(NS, req, async ({ state }) => {
    const { websiteId } = await requireSessionWithWebsite();

    return logSpan(
      NS,
      { ns: NS, method: "GET", state, websiteId },
      async () => {
        const repo = getSiteRepository({ websiteId });
        const bundle = await repo.readSettingsWithRevisions(state);

        const res: GetFooterResponse = {
          settings: bundle.settings.footer,
          revision: bundle.revisions.footerRevision,
        };

        return res;
      },
    );
  });
}

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
      const result = await run(input);

      logger.debug?.("route.footer.patch.afterWrite", {
        websiteId,
        expectedRevision: input.expectedRevision,
        revision: result.revision,
      });

      /**
       * Invalidates the active Website status cache.
       *
       * The cache may still be backed by KV in infra, but its business scope is
       * the Prisma Website.id.
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
        settings: result.settings,
        revision: result.revision,
      };

      return res;
    });
  });
}
