/**
 * @file apps/studio/src/app/api/settings/legal-menu/route.ts
 * @layer api/routes
 * @description
 * Route API Admin pour la lecture et la mise à jour du menu légal.
 *
 * Responsabilités :
 * - GET   : retourne les settings LegalMenu selon le state (draft/published).
 * - PATCH : met à jour les settings LegalMenu (draft-only) via un DTO intent,
 *           adaptation en patch domaine, et exécution du use-case `updateLegalMenuSettings`.
 * - Le repository merge avec les defaults pour assurer la cohérence.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { updateLegalMenuSettings } from "@compoz/core/domain/site/use-cases/legal-menu/update-legal-menu-settings";
import { readJsonOr400 } from "@compoz/infra/http/read-json";
import { log, logSpan } from "@compoz/infra/lib/log";
import { getSiteRepository, getSiteStatusCache } from "@compoz/infra/site";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import { adaptUpdateLegalMenuIntent } from "@compoz/studio/app/api/_adapters/menus";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";

import type {
  GetLegalMenuResponse,
  PatchLegalMenuResponse,
} from "@compoz/infra/http/studio/site-settings.types";
import { UpdateLegalMenuSettingsIntentSchema } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu-intents";

export async function GET(req: Request) {
  const NS = "api.admin.site.legal-menu.GET" as const;

  return handleRoute(NS, req, async ({ state }) => {
    return logSpan(NS, { ns: NS, method: "GET", state }, async () => {
      const repo = getSiteRepository();
      const settings = await repo.readSettings(state);

      const res: GetLegalMenuResponse = { settings: settings.legalMenu };
      return res;
    });
  });
}

export async function PATCH(req: Request) {
  const NS = "api.admin.site.legal-menu.PATCH" as const;

  return handleRoute(NS, req, async () => {
    return logSpan(NS, { ns: NS, method: "PATCH" }, async () => {
      const raw = await readJsonOr400(req);

      log.info?.("LEGAL_MENU.PATCH.start", {
        hasBody: raw != null,
        bodyKeys: raw && typeof raw === "object" ? Object.keys(raw) : [],
        envTenant: process.env["COMPOZ_SITE_ID"] ?? "default",
        hasKvUrl: Boolean(
          process.env["KV_REST_API_URL"] ??
          process.env["UPSTASH_REDIS_REST_URL"],
        ),
      });

      const dto = parseDTOOrHttp(UpdateLegalMenuSettingsIntentSchema, raw, {
        message: EC.VALIDATION_ERROR,
        extras: { where: "api.admin.site.legal-menu.PATCH.payload" },
      });

      const input = adaptUpdateLegalMenuIntent(dto);

      const repo = getSiteRepository();
      const statusCache = getSiteStatusCache();

      const run = updateLegalMenuSettings({ repo });
      const { settings } = await run(input);

      log.info?.("LEGAL_MENU.PATCH.afterWrite", {
        legalMenuKeys: settings?.legalMenu
          ? Object.keys(settings.legalMenu)
          : [],
      });

      try {
        log.info?.("LEGAL_MENU.PATCH.invalidate.start", {});
        await statusCache.invalidateStatus();
        log.info?.("LEGAL_MENU.PATCH.invalidate.done", {});
      } catch (e) {
        log.error?.("LEGAL_MENU.PATCH.invalidate.failed", { err: String(e) });
      }
      const res: PatchLegalMenuResponse = { settings: settings.legalMenu };
      return res;
    });
  });
}
