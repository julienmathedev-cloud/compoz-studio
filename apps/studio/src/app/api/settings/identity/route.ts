/**
 * @file apps/studio/src/app/api/settings/identity/route.ts
 * @layer api/routes
 * @description
 * Route API Admin pour la lecture et la mise à jour des réglages Identity du site.
 *
 * Responsabilités :
 * - GET   : retourne les settings Identity selon le state (draft/published).
 * - PATCH : met à jour les settings Identity (draft-only) via un DTO intent,
 *           adaptation en patch domaine, et exécution du use-case `updateIdentitySettings`.
 * - Le repository merge avec les defaults pour assurer la cohérence.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { updateIdentitySettings } from "@compoz/core/domain/site/use-cases/identity/update-identity-settings";
import { readJsonOr400 } from "@compoz/infra/http/read-json";
import { log, logSpan } from "@compoz/infra/lib/log";
import { getSiteRepository, getSiteStatusCache } from "@compoz/infra/site";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import { adaptUpdateIdentityIntent } from "@compoz/studio/app/api/_adapters/identity";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";

import { UpdateIdentitySettingsIntentSchema } from "@compoz/validation/site/settings/identity/identity-intents";

import type {
  GetIdentityResponse,
  PatchIdentityResponse,
} from "@compoz/infra/http/studio/site-settings.types";

export async function GET(req: Request) {
  const NS = "api.admin.site.identity.GET" as const;

  return handleRoute(NS, req, async ({ state }) => {
    return logSpan(NS, { ns: NS, method: "GET", state }, async () => {
      const repo = getSiteRepository();
      const settings = await repo.readSettings(state);

      const res: GetIdentityResponse = { settings: settings.identity };
      return res;
    });
  });
}

export async function PATCH(req: Request) {
  const NS = "api.admin.site.identity.PATCH" as const;

  return handleRoute(NS, req, async () => {
    return logSpan(NS, { ns: NS, method: "PATCH" }, async () => {
      const raw = await readJsonOr400(req);

      log.info?.("IDENTITY.PATCH.start", {
        hasBody: raw != null,
        bodyKeys: raw && typeof raw === "object" ? Object.keys(raw) : [],
        envTenant: process.env["COMPOZ_SITE_ID"] ?? "default",
        hasKvUrl: Boolean(
          process.env["KV_REST_API_URL"] ??
          process.env["UPSTASH_REDIS_REST_URL"],
        ),
      });

      const dto = parseDTOOrHttp(UpdateIdentitySettingsIntentSchema, raw, {
        message: EC.VALIDATION_ERROR,
        extras: { where: "api.admin.site.identity.PATCH.payload" },
      });

      const input = adaptUpdateIdentityIntent(dto);

      const repo = getSiteRepository();
      const statusCache = getSiteStatusCache();

      // ⚠️ Aligné footer : le use-case ne reçoit que `repo`
      const run = updateIdentitySettings({ repo });
      const { settings } = await run(input);

      log.info?.("IDENTITY.PATCH.afterWrite", {
        identityKeys: settings?.identity ? Object.keys(settings.identity) : [],
      });

      try {
        log.info?.("IDENTITY.PATCH.invalidate.start", {});
        await statusCache.invalidateStatus();
        log.info?.("IDENTITY.PATCH.invalidate.done", {});
      } catch (e) {
        log.error?.("IDENTITY.PATCH.invalidate.failed", { err: String(e) });
      }

      const res: PatchIdentityResponse = { settings: settings.identity };
      return res;
    });
  });
}
