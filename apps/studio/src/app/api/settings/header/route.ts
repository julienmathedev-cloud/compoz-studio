/**
 * @file apps/studio/src/app/api/settings/header/route.ts
 * @layer api/routes
 * @description
 * Route API Admin pour la lecture et la mise à jour des settings du Header du site.
 *
 * Responsabilités :
 * - GET  : retourne les settings Header selon le state (draft/published).
 * - PATCH: met à jour les settings Header (draft-only) via un DTO intent, adaptation en patch domaine,
 *          et exécution du use-case `updateHeaderSettings`.
 * - Le repository merge les settings persistés avec les defaults pour garantir la cohérence.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { updateHeaderSettings } from "@compoz/core/domain/site/use-cases/header/update-header-settings";
import { readJsonOr400 } from "@compoz/infra/http/read-json";
import type {
  GetHeaderResponse,
  PatchHeaderResponse,
} from "@compoz/infra/http/studio/site-settings.types";
import { log, logSpan } from "@compoz/infra/lib/log";
import { getSiteRepository, getSiteStatusCache } from "@compoz/infra/site";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import { adaptUpdateHeaderIntent } from "@compoz/studio/app/api/_adapters/header";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";

import { UpdateHeaderSettingsIntentSchema } from "@compoz/validation/site/settings/header/header-intents";

export async function GET(req: Request) {
  const NS = "api.admin.site.header.GET" as const;

  return handleRoute(NS, req, async ({ state }) => {
    return logSpan(NS, { ns: NS, method: "GET", state }, async () => {
      const repo = getSiteRepository();
      const settings = await repo.readSettings(state);

      const res: GetHeaderResponse = { settings: settings.header };
      return res;
    });
  });
}

export async function PATCH(req: Request) {
  const NS = "api.admin.site.header.PATCH" as const;

  return handleRoute(NS, req, async () => {
    return logSpan(NS, { ns: NS, method: "PATCH" }, async () => {
      const raw = await readJsonOr400(req);

      log.info?.("HEADER.PATCH.start", {
        hasBody: raw != null,
        bodyKeys: raw && typeof raw === "object" ? Object.keys(raw) : [],
        envTenant: process.env["COMPOZ_SITE_ID"] ?? "default",
        hasKvUrl: Boolean(
          process.env["KV_REST_API_URL"] ??
          process.env["UPSTASH_REDIS_REST_URL"],
        ),
      });

      const dto = parseDTOOrHttp(UpdateHeaderSettingsIntentSchema, raw, {
        message: EC.VALIDATION_ERROR,
        extras: { where: "api.admin.site.header.PATCH.payload" },
      });

      const input = adaptUpdateHeaderIntent(dto);

      const repo = getSiteRepository();
      const statusCache = getSiteStatusCache();

      // ⚠️ Aligné footer : le use-case ne reçoit que `repo`
      const run = updateHeaderSettings({ repo });
      const { settings } = await run(input);

      log.info?.("HEADER.PATCH.afterWrite", {
        headerKeys: settings?.header ? Object.keys(settings.header) : [],
      });

      try {
        log.info?.("HEADER.PATCH.invalidate.start", {});
        await statusCache.invalidateStatus();
        log.info?.("HEADER.PATCH.invalidate.done", {});
      } catch (e) {
        log.error?.("HEADER.PATCH.invalidate.failed", { err: String(e) });
      }
      const res: PatchHeaderResponse = { settings: settings.header };
      return res;
    });
  });
}
