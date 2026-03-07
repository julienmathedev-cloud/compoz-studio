/**
 * @file apps/studio/src/app/api/settings/social/route.ts
 * @layer studio/app/api
 * @description
 * Route API Studio pour la lecture et la mise à jour des réglages Social du site.
 *
 * Responsabilités :
 * - GET   : retourne les settings Social selon le state (draft/published).
 * - PATCH : met à jour les settings Social (draft-only) via un DTO intent,
 *           adaptation en patch domaine, et exécution du use-case `updateSocialSettings`.
 * - Le repository merge avec les defaults pour assurer la cohérence.
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
import { requireSessionWithTenant } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import { UpdateSocialSettingsIntentSchema } from "@compoz/validation/site/settings/social/social-intents";

export async function GET(req: Request) {
  const NS = "api.studio.site.social.GET" as const;

  return handleRoute(NS, req, async ({ state }) => {
    const { tenantId } = await requireSessionWithTenant();

    return logSpan(NS, { ns: NS, method: "GET", state, tenantId }, async () => {
      const repo = getSiteRepository({ tenantId });
      const settings = await repo.readSettings(state);

      const res: GetSocialResponse = { settings: settings.social };
      return res;
    });
  });
}

export async function PATCH(req: Request) {
  const NS = "api.studio.site.social.PATCH" as const;

  return handleRoute(NS, req, async () => {
    const { tenantId } = await requireSessionWithTenant();

    return logSpan(NS, { ns: NS, method: "PATCH", tenantId }, async () => {
      const lg = log.child({ ns: NS });

      const raw = await readJsonOr400(req);

      lg.info?.("route.social.patch.start", {
        tenantId,
        hasBody: raw != null,
        bodyKeys: raw && typeof raw === "object" ? Object.keys(raw) : [],
        hasKvUrl: Boolean(
          process.env["KV_REST_API_URL"] ??
          process.env["UPSTASH_REDIS_REST_URL"],
        ),
      });

      const dto = parseDTOOrHttp(UpdateSocialSettingsIntentSchema, raw, {
        message: EC.VALIDATION_ERROR,
        extras: { where: "api.studio.site.social.PATCH.payload" },
      });

      const input = adaptUpdateSocialIntent(dto);

      const repo = getSiteRepository({ tenantId });
      const statusCache = getSiteStatusCache({ tenantId });

      const run = updateSocialSettings({ repo });
      const { settings } = await run(input);

      lg.info?.("route.social.patch.afterWrite", {
        tenantId,
        socialKeys: settings?.social ? Object.keys(settings.social) : [],
      });

      try {
        lg.info?.("route.social.patch.invalidate.start", { tenantId });
        await statusCache.invalidateStatus();
        lg.info?.("route.social.patch.invalidate.done", { tenantId });
      } catch (e) {
        lg.error?.("route.social.patch.invalidate.failed", {
          tenantId,
          err: String(e),
        });
      }

      const res: PatchSocialResponse = { settings: settings.social };
      return res;
    });
  });
}
