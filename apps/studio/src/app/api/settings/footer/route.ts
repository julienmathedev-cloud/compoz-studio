/**
 * @file apps/studio/src/app/api/settings/footer/route.ts
 * @layer studio/app/api
 * @description
 * Route API Studio pour la lecture et la mise à jour des settings du Footer du site.
 *
 * Responsabilités :
 * - GET  : retourne les settings Footer selon le state (draft/published).
 * - PATCH: met à jour les settings Footer (draft-only) via un DTO intent, adaptation en patch domaine,
 *          et exécution du use-case `updateFooterSettings`.
 * - Le repository gère le merge avec les defaults pour assurer la cohérence du footer.
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
import { requireSessionWithTenant } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import { UpdateFooterSettingsIntentSchema } from "@compoz/validation/site/settings/footer/footer-intents";

export async function GET(req: Request) {
  const NS = "api.studio.site.footer.GET" as const;

  return handleRoute(NS, req, async ({ state }) => {
    const { tenantId } = await requireSessionWithTenant();

    return logSpan(NS, { ns: NS, method: "GET", state, tenantId }, async () => {
      const repo = getSiteRepository({ tenantId });
      const settings = await repo.readSettings(state);

      const res: GetFooterResponse = { settings: settings.footer };
      return res;
    });
  });
}

export async function PATCH(req: Request) {
  const NS = "api.studio.site.footer.PATCH" as const;

  return handleRoute(NS, req, async () => {
    const { tenantId } = await requireSessionWithTenant();

    return logSpan(NS, { ns: NS, method: "PATCH", tenantId }, async () => {
      const lg = log.child({ ns: NS });

      const raw = await readJsonOr400(req);

      lg.debug?.("route.footer.patch.start", {
        tenantId,
        hasBody: raw != null,
        bodyKeys: raw && typeof raw === "object" ? Object.keys(raw) : [],
        hasKvUrl: Boolean(
          process.env["KV_REST_API_URL"] ??
          process.env["UPSTASH_REDIS_REST_URL"],
        ),
      });

      const dto = parseDTOOrHttp(UpdateFooterSettingsIntentSchema, raw, {
        message: EC.VALIDATION_ERROR,
        extras: { where: "api.studio.site.footer.PATCH.payload" },
      });

      const input = adaptUpdateFooterIntent(dto);

      const repo = getSiteRepository({ tenantId });
      const statusCache = getSiteStatusCache({ tenantId });

      const run = updateFooterSettings({ repo });
      const { settings } = await run(input);

      lg.debug?.("route.footer.patch.afterWrite", {
        tenantId,
        footerKeys: settings?.footer ? Object.keys(settings.footer) : [],
      });

      try {
        lg.debug?.("route.footer.patch.invalidate.start", { tenantId });
        await statusCache.invalidateStatus();
        lg.debug?.("route.footer.patch.invalidate.done", { tenantId });
      } catch (e) {
        lg.error?.("route.footer.patch.invalidate.failed", {
          tenantId,
          err: String(e),
        });
      }

      const res: PatchFooterResponse = { settings: settings.footer };
      return res;
    });
  });
}
