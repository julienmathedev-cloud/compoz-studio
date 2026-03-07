/**
 * @file apps/studio/src/app/api/settings/header/route.ts
 * @layer studio/app/api
 * @description
 * Route API Studio pour la lecture et la mise à jour des settings du Header du site.
 *
 * Responsabilités :
 * - GET  : retourne les settings Header selon le state (draft/published).
 * - PATCH: met à jour les settings Header (draft-only) via un DTO intent, adaptation en patch domaine,
 *          et exécution du use-case `updateHeaderSettings`.
 * - Le repository merge les settings persistés avec les defaults pour garantir la cohérence.
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
import { requireSessionWithTenant } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import { UpdateHeaderSettingsIntentSchema } from "@compoz/validation/site/settings/header/header-intents";

export async function GET(req: Request) {
  const NS = "api.studio.site.header.GET" as const;

  return handleRoute(NS, req, async ({ state }) => {
    const { tenantId } = await requireSessionWithTenant();

    return logSpan(NS, { ns: NS, method: "GET", state, tenantId }, async () => {
      const repo = getSiteRepository({ tenantId });
      const settings = await repo.readSettings(state);

      const res: GetHeaderResponse = { settings: settings.header };
      return res;
    });
  });
}

export async function PATCH(req: Request) {
  const NS = "api.studio.site.header.PATCH" as const;

  return handleRoute(NS, req, async () => {
    const { tenantId } = await requireSessionWithTenant();

    return logSpan(NS, { ns: NS, method: "PATCH", tenantId }, async () => {
      const lg = log.child({ ns: NS });

      const raw = await readJsonOr400(req);

      lg.info?.("route.header.patch.start", {
        tenantId,
        hasBody: raw != null,
        bodyKeys: raw && typeof raw === "object" ? Object.keys(raw) : [],
        hasKvUrl: Boolean(
          process.env["KV_REST_API_URL"] ??
          process.env["UPSTASH_REDIS_REST_URL"],
        ),
      });

      const dto = parseDTOOrHttp(UpdateHeaderSettingsIntentSchema, raw, {
        message: EC.VALIDATION_ERROR,
        extras: { where: "api.studio.site.header.PATCH.payload" },
      });

      const input = adaptUpdateHeaderIntent(dto);

      const repo = getSiteRepository({ tenantId });
      const statusCache = getSiteStatusCache({ tenantId });

      // ⚠️ Aligné footer : le use-case ne reçoit que `repo`
      const run = updateHeaderSettings({ repo });
      const { settings } = await run(input);

      lg.info?.("route.header.patch.afterWrite", {
        tenantId,
        headerKeys: settings?.header ? Object.keys(settings.header) : [],
      });

      try {
        lg.info?.("route.header.patch.invalidate.start", { tenantId });
        await statusCache.invalidateStatus();
        lg.info?.("route.header.patch.invalidate.done", { tenantId });
      } catch (e) {
        lg.error?.("route.header.patch.invalidate.failed", {
          tenantId,
          err: String(e),
        });
      }

      const res: PatchHeaderResponse = { settings: settings.header };
      return res;
    });
  });
}
