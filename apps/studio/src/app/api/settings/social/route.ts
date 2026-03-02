/**
 * @file apps/studio/src/app/api/settings/social/route.ts
 * @layer api/routes
 * @description
 * Route API Admin pour la lecture et la mise à jour des réglages Social du site.
 *
 * Responsabilités :
 * - GET   : retourne les settings Social selon le state (draft/published).
 * - PATCH : met à jour les settings Social (draft-only) via un DTO intent,
 *           adaptation en patch domaine, et exécution du use-case `updateSocialSettings`.
 * - Le repository merge avec les defaults pour assurer la cohérence.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { updateSocialSettings } from "@compoz/core/domain/site/use-cases/social/update-social-settings";
import { readJsonOr400 } from "@compoz/infra/http/read-json";
import { log, logSpan } from "@compoz/infra/lib/log";
import { getSiteRepository, getSiteStatusCache } from "@compoz/infra/site";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import { adaptUpdateSocialIntent } from "@compoz/studio/app/api/_adapters/social";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";

import type {
  GetSocialResponse,
  PatchSocialResponse,
} from "@compoz/infra/http/studio/site-settings.types";
import { UpdateSocialSettingsIntentSchema } from "@compoz/validation/site/settings/social/social-intents";

export async function GET(req: Request) {
  const NS = "api.admin.site.social.GET" as const;

  return handleRoute(NS, req, async ({ state }) => {
    return logSpan(NS, { ns: NS, method: "GET", state }, async () => {
      const repo = getSiteRepository();
      const settings = await repo.readSettings(state);

      const res: GetSocialResponse = { settings: settings.social };
      return res;
    });
  });
}

export async function PATCH(req: Request) {
  const NS = "api.admin.site.social.PATCH" as const;

  return handleRoute(NS, req, async () => {
    return logSpan(NS, { ns: NS, method: "PATCH" }, async () => {
      const raw = await readJsonOr400(req);

      log.info?.("SOCIAL.PATCH.start", {
        hasBody: raw != null,
        bodyKeys: raw && typeof raw === "object" ? Object.keys(raw) : [],
        envTenant: process.env["COMPOZ_SITE_ID"] ?? "default",
        hasKvUrl: Boolean(
          process.env["KV_REST_API_URL"] ??
          process.env["UPSTASH_REDIS_REST_URL"],
        ),
      });

      const dto = parseDTOOrHttp(UpdateSocialSettingsIntentSchema, raw, {
        message: EC.VALIDATION_ERROR,
        extras: { where: "api.admin.site.social.PATCH.payload" },
      });

      const input = adaptUpdateSocialIntent(dto);

      const repo = getSiteRepository();
      const statusCache = getSiteStatusCache();

      const run = updateSocialSettings({ repo });
      const { settings } = await run(input);

      log.info?.("SOCIAL.PATCH.afterWrite", {
        socialKeys: settings?.social ? Object.keys(settings.social) : [],
      });

      try {
        log.info?.("SOCIAL.PATCH.invalidate.start", {});
        await statusCache.invalidateStatus();
        log.info?.("SOCIAL.PATCH.invalidate.done", {});
      } catch (e) {
        log.error?.("SOCIAL.PATCH.invalidate.failed", { err: String(e) });
      }

      const res: PatchSocialResponse = { settings: settings.social };
      return res;
    });
  });
}
