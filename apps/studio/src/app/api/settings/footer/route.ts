/**
 * @file apps/studio/src/app/api/settings/footer/route.ts
 * @layer api/routes
 * @description
 * Route API Admin pour la lecture et la mise à jour des settings du Footer du site.
 *
 * Responsabilités :
 * - GET  : retourne les settings Footer selon le state (draft/published).
 * - PATCH: met à jour les settings Footer (draft-only) via un DTO intent, adaptation en patch domaine,
 *          et exécution du use-case `updateFooterSettings`.
 * - Le repository gère le merge avec les defaults pour assurer la cohérence du footer.
 */
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { updateFooterSettings } from "@compoz/core/domain/site/use-cases/footer/update-footer-settings";
import { readJsonOr400 } from "@compoz/infra/http/read-json";
import { log, logSpan } from "@compoz/infra/lib/log";
import { getSiteRepository, getSiteStatusCache } from "@compoz/infra/site";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import { adaptUpdateFooterIntent } from "@compoz/studio/app/api/_adapters/footer";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";

import type {
  GetFooterResponse,
  PatchFooterResponse,
} from "@compoz/infra/http/studio/site-settings.types";
import { UpdateFooterSettingsIntentSchema } from "@compoz/validation/site/settings/footer/footer-intents";

export async function GET(req: Request) {
  const NS = "api.admin.site.footer.GET" as const;

  return handleRoute(NS, req, async ({ state }) => {
    return logSpan(NS, { ns: NS, method: "GET", state }, async () => {
      const repo = getSiteRepository();
      const settings = await repo.readSettings(state);

      const res: GetFooterResponse = { settings: settings.footer };
      return res;
    });
  });
}

export async function PATCH(req: Request) {
  const NS = "api.admin.site.footer.PATCH" as const;

  return handleRoute(NS, req, async () => {
    return logSpan(NS, { ns: NS, method: "PATCH" }, async () => {
      const raw = await readJsonOr400(req);

      log.info?.("FOOTER.PATCH.start", {
        hasBody: raw != null,
        bodyKeys: raw && typeof raw === "object" ? Object.keys(raw) : [],
        envTenant: process.env["COMPOZ_SITE_ID"] ?? "default",
        hasKvUrl: Boolean(
          process.env["KV_REST_API_URL"] ??
          process.env["UPSTASH_REDIS_REST_URL"],
        ),
      });

      const dto = parseDTOOrHttp(UpdateFooterSettingsIntentSchema, raw, {
        message: EC.VALIDATION_ERROR,
        extras: { where: "api.admin.site.footer.PATCH.payload" },
      });

      const input = adaptUpdateFooterIntent(dto);

      const repo = getSiteRepository();
      const statusCache = getSiteStatusCache();

      const run = updateFooterSettings({ repo });
      const { settings } = await run(input);

      log.info?.("FOOTER.PATCH.afterWrite", {
        footerKeys: settings?.footer ? Object.keys(settings.footer) : [],
      });

      try {
        log.info?.("FOOTER.PATCH.invalidate.start", {});
        await statusCache.invalidateStatus();
        log.info?.("FOOTER.PATCH.invalidate.done", {});
      } catch (e) {
        log.error?.("FOOTER.PATCH.invalidate.failed", { err: String(e) });
      }
      const res: PatchFooterResponse = { settings: settings.footer };
      return res;
    });
  });
}
