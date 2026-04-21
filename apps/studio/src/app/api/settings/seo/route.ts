/**
 * @file apps/studio/src/app/api/settings/seo/route.ts
 * @layer studio/app/api
 * @description
 * Route API Studio pour la lecture et la mise à jour des réglages SEO du site.
 *
 * Responsabilités :
 * - GET   : retourne les settings SEO selon le state (draft/published).
 * - PATCH : met à jour les settings SEO (draft-only) via un DTO intent,
 *           adaptation en patch domaine, et exécution du use-case `updateSeoSettings`.
 * - Le repository merge avec les defaults pour assurer la cohérence.
 */

import "server-only";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { updateSeoSettings } from "@compoz/core/domain/site/use-cases/seo/update-seo-settings";
import { readJsonOr400 } from "@compoz/infra/http/read-json";
import type {
  GetSeoResponse,
  PatchSeoResponse,
} from "@compoz/infra/http/studio/site-settings.types";
import { log, logSpan } from "@compoz/infra/lib/log";
import { getSiteRepository, getSiteStatusCache } from "@compoz/infra/site";
import { adaptUpdateSeoIntent } from "@compoz/studio/app/api/_adapters/seo";
import { requireSessionWithTenant } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import { createUpdateSeoSettingsIntentSchema } from "@compoz/validation/site/settings/seo/seo-intents";

export async function GET(req: Request) {
  const NS = "api.studio.site.seo.GET" as const;

  return handleRoute(NS, req, async ({ state }) => {
    const { tenantId } = await requireSessionWithTenant();

    return logSpan(NS, { ns: NS, method: "GET", state, tenantId }, async () => {
      const repo = getSiteRepository({ tenantId });
      const settings = await repo.readSettings(state);

      const res: GetSeoResponse = { settings: settings.seo };
      return res;
    });
  });
}

export async function PATCH(req: Request) {
  const NS = "api.studio.site.seo.PATCH" as const;

  return handleRoute(NS, req, async () => {
    const { tenantId } = await requireSessionWithTenant();

    return logSpan(NS, { ns: NS, method: "PATCH", tenantId }, async () => {
      const lg = log.child({ ns: NS });

      const raw = await readJsonOr400(req);

      lg.debug?.("route.seo.patch.start", {
        tenantId,
        hasBody: raw != null,
        bodyKeys: raw && typeof raw === "object" ? Object.keys(raw) : [],
        hasKvUrl: Boolean(
          process.env["KV_REST_API_URL"] ??
          process.env["UPSTASH_REDIS_REST_URL"],
        ),
      });

      const isProd = process.env.NODE_ENV === "production";

      const schema = createUpdateSeoSettingsIntentSchema({
        requireBaseUrlHttps: isProd,
      });

      const dto = parseDTOOrHttp(schema, raw, {
        message: EC.VALIDATION_ERROR,
        extras: { where: "api.studio.site.seo.PATCH.payload" },
      });

      const input = adaptUpdateSeoIntent(dto);

      const repo = getSiteRepository({ tenantId });
      const statusCache = getSiteStatusCache({ tenantId });

      const run = updateSeoSettings({ repo });
      const { settings } = await run(input);

      lg.debug?.("route.seo.patch.afterWrite", {
        tenantId,
        seoKeys: settings?.seo ? Object.keys(settings.seo) : [],
      });

      try {
        lg.debug?.("route.seo.patch.invalidate.start", { tenantId });
        await statusCache.invalidateStatus();
        lg.debug?.("route.seo.patch.invalidate.done", { tenantId });
      } catch (e) {
        lg.error?.("route.seo.patch.invalidate.failed", {
          tenantId,
          err: String(e),
        });
      }

      const res: PatchSeoResponse = { settings: settings.seo };
      return res;
    });
  });
}
