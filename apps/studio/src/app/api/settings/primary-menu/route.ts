/**
 * @file apps/studio/src/app/api/settings/primary-menu/route.ts
 * @layer api/routes
 * @description
 * Route API Admin pour la lecture et la mise à jour du menu principal (PrimaryMenu).
 *
 * Responsabilités :
 * - GET   : retourne les settings PrimaryMenu selon le state (draft/published).
 * - PATCH : met à jour les settings PrimaryMenu (draft-only) via un DTO intent,
 *           adaptation en patch domaine, et exécution du use-case `updatePrimaryMenuSettings`.
 * - Le repository merge avec les defaults pour assurer la cohérence.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { updatePrimaryMenuSettings } from "@compoz/core/domain/site/use-cases/primary-menu/update-primary-menu-settings";
import { getSiteRepository, getSiteStatusCache } from "@compoz/infra/site";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import { adaptUpdatePrimaryMenuIntent } from "@compoz/studio/app/api/_adapters/menus";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";

import { readJsonOr400 } from "@compoz/infra/http/read-json";
import type {
  GetPrimaryMenuResponse,
  PatchPrimaryMenuResponse,
} from "@compoz/infra/http/studio/site-settings.types";
import { log, logSpan } from "@compoz/infra/lib/log";
import { UpdatePrimaryMenuSettingsIntentSchema } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu-intents";

export async function GET(req: Request) {
  const NS = "api.admin.site.primary-menu.GET" as const;

  return handleRoute(NS, req, async ({ state }) => {
    return logSpan(NS, { ns: NS, method: "GET", state }, async () => {
      const repo = getSiteRepository();
      const settings = await repo.readSettings(state);

      const res: GetPrimaryMenuResponse = { settings: settings.primaryMenu };
      return res;
    });
  });
}

export async function PATCH(req: Request) {
  const NS = "api.admin.site.primary-menu.PATCH" as const;

  return handleRoute(NS, req, async () => {
    return logSpan(NS, { ns: NS, method: "PATCH" }, async () => {
      const raw = await readJsonOr400(req);

      log.info?.("PRIMARY_MENU.PATCH.start", {
        hasBody: raw != null,
        bodyKeys: raw && typeof raw === "object" ? Object.keys(raw) : [],
        envTenant: process.env["COMPOZ_SITE_ID"] ?? "default",
        hasKvUrl: Boolean(
          process.env["KV_REST_API_URL"] ??
          process.env["UPSTASH_REDIS_REST_URL"],
        ),
      });

      const dto = parseDTOOrHttp(UpdatePrimaryMenuSettingsIntentSchema, raw, {
        message: EC.VALIDATION_ERROR,
        extras: { where: "api.admin.site.primary-menu.PATCH.payload" },
      });

      const input = adaptUpdatePrimaryMenuIntent(dto);

      const repo = getSiteRepository();
      const statusCache = getSiteStatusCache();

      const run = updatePrimaryMenuSettings({ repo });
      const { settings } = await run(input);

      log.info?.("PRIMARY_MENU.PATCH.afterWrite", {
        primaryMenuKeys: settings?.primaryMenu
          ? Object.keys(settings.primaryMenu)
          : [],
      });

      try {
        log.info?.("PRIMARY_MENU.PATCH.invalidate.start", {});
        await statusCache.invalidateStatus();
        log.info?.("PRIMARY_MENU.PATCH.invalidate.done", {});
      } catch (e) {
        log.error?.("PRIMARY_MENU.PATCH.invalidate.failed", { err: String(e) });
      }

      const res: PatchPrimaryMenuResponse = { settings: settings.primaryMenu };
      return res;
    });
  });
}
