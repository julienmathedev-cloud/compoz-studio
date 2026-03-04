/**
 * @file apps/studio/src/app/api/settings/seo/route.ts
 * @layer api/routes
 * @description
 * Route API Admin pour la lecture et la mise à jour des réglages SEO du site.
 *
 * Responsabilités :
 * - GET   : retourne les settings SEO selon le state (draft/published).
 * - PATCH : met à jour les settings SEO (draft-only) via un DTO intent,
 *           adaptation en patch domaine, et exécution du use-case `updateSeoSettings`.
 * - Le repository merge avec les defaults pour assurer la cohérence.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { updateSeoSettings } from "@compoz/core/domain/site/use-cases/seo/update-seo-settings";
import { readJsonOr400 } from "@compoz/infra/http/read-json";
import { log, logSpan } from "@compoz/infra/lib/log";
import { getSiteRepository, getSiteStatusCache } from "@compoz/infra/site";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import { adaptUpdateSeoIntent } from "@compoz/studio/app/api/_adapters/seo";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";

import type {
  GetSeoResponse,
  PatchSeoResponse,
} from "@compoz/infra/http/studio/site-settings.types";
import { UpdateSeoSettingsIntentSchema } from "@compoz/validation/site/settings/seo/seo-intents";
import { requireSessionWithTenant } from "@compoz/studio/auth/require-session";

export async function GET(req: Request) {
  const NS = "api.admin.site.seo.GET" as const;

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
  const NS = "api.admin.site.seo.PATCH" as const;

  return handleRoute(NS, req, async () => {
    const { tenantId } = await requireSessionWithTenant();

    return logSpan(NS, { ns: NS, method: "PATCH", tenantId }, async () => {
      const raw = await readJsonOr400(req);

      log.info?.("SEO.PATCH.start", {
        tenantId,
        hasBody: raw != null,
        bodyKeys: raw && typeof raw === "object" ? Object.keys(raw) : [],
        hasKvUrl: Boolean(
          process.env["KV_REST_API_URL"] ??
          process.env["UPSTASH_REDIS_REST_URL"],
        ),
      });

      const dto = parseDTOOrHttp(UpdateSeoSettingsIntentSchema, raw, {
        message: EC.VALIDATION_ERROR,
        extras: { where: "api.admin.site.seo.PATCH.payload" },
      });

      const input = adaptUpdateSeoIntent(dto);

      const repo = getSiteRepository({ tenantId });
      const statusCache = getSiteStatusCache({ tenantId });

      const run = updateSeoSettings({ repo });
      const { settings } = await run(input);

      log.info?.("SEO.PATCH.afterWrite", {
        tenantId,
        seoKeys: settings?.seo ? Object.keys(settings.seo) : [],
      });

      try {
        log.info?.("SEO.PATCH.invalidate.start", { tenantId });
        await statusCache.invalidateStatus();
        log.info?.("SEO.PATCH.invalidate.done", { tenantId });
      } catch (e) {
        log.error?.("SEO.PATCH.invalidate.failed", {
          tenantId,
          err: String(e),
        });
      }

      const res: PatchSeoResponse = { settings: settings.seo };
      return res;
    });
  });
}
