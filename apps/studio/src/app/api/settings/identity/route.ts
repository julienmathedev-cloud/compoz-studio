/**
 * @file apps/studio/src/app/api/settings/identity/route.ts
 * @layer studio/app/api
 * @description
 * Route API Studio pour la lecture et la mise à jour des réglages Identity du site.
 *
 * Responsabilités :
 * - GET   : retourne les settings Identity selon le state (draft/published).
 * - PATCH : met à jour les settings Identity (draft-only) via un DTO intent,
 *           adaptation en patch domaine, et exécution du use-case `updateIdentitySettings`.
 * - Le repository merge avec les defaults pour assurer la cohérence.
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
import { requireSessionWithTenant } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import { UpdateIdentitySettingsIntentSchema } from "@compoz/validation/site/settings/identity/identity-intents";

export async function GET(req: Request) {
  const NS = "api.studio.site.identity.GET" as const;

  return handleRoute(NS, req, async ({ state }) => {
    const { tenantId } = await requireSessionWithTenant();

    return logSpan(NS, { ns: NS, method: "GET", state, tenantId }, async () => {
      const repo = getSiteRepository({ tenantId });
      const settings = await repo.readSettings(state);

      const res: GetIdentityResponse = { settings: settings.identity };
      return res;
    });
  });
}

export async function PATCH(req: Request) {
  const NS = "api.studio.site.identity.PATCH" as const;

  return handleRoute(NS, req, async () => {
    const { tenantId } = await requireSessionWithTenant();

    return logSpan(NS, { ns: NS, method: "PATCH", tenantId }, async () => {
      const lg = log.child({ ns: NS });

      const raw = await readJsonOr400(req);

      lg.debug?.("route.identity.patch.start", {
        tenantId,
        hasBody: raw != null,
        bodyKeys: raw && typeof raw === "object" ? Object.keys(raw) : [],
        hasKvUrl: Boolean(
          process.env["KV_REST_API_URL"] ??
          process.env["UPSTASH_REDIS_REST_URL"],
        ),
      });

      const dto = parseDTOOrHttp(UpdateIdentitySettingsIntentSchema, raw, {
        message: EC.VALIDATION_ERROR,
        extras: { where: "api.studio.site.identity.PATCH.payload" },
      });

      const input = adaptUpdateIdentityIntent(dto);

      const repo = getSiteRepository({ tenantId });
      const statusCache = getSiteStatusCache({ tenantId });

      // ⚠️ Aligné footer : le use-case ne reçoit que `repo`
      const run = updateIdentitySettings({ repo });
      const { settings } = await run(input);

      lg.debug?.("route.identity.patch.afterWrite", {
        tenantId,
        identityKeys: settings?.identity ? Object.keys(settings.identity) : [],
      });

      try {
        lg.debug?.("route.identity.patch.invalidate.start", { tenantId });
        await statusCache.invalidateStatus();
        lg.debug?.("route.identity.patch.invalidate.done", { tenantId });
      } catch (e) {
        lg.error?.("route.identity.patch.invalidate.failed", {
          tenantId,
          err: String(e),
        });
      }

      const res: PatchIdentityResponse = { settings: settings.identity };
      return res;
    });
  });
}
