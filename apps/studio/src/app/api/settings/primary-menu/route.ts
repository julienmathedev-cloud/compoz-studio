/**
 * @file apps/studio/src/app/api/settings/primary-menu/route.ts
 * @layer studio/app/api
 * @description
 * Route API Studio pour la lecture et la mise à jour du menu principal (PrimaryMenu).
 *
 * Responsabilités :
 * - GET   : retourne les settings PrimaryMenu selon le state (draft/published).
 * - PATCH : met à jour les settings PrimaryMenu (draft-only) via un DTO intent,
 *           adaptation en patch domaine, et exécution du use-case `updatePrimaryMenuSettings`.
 * - Le repository merge avec les defaults pour assurer la cohérence.
 */

import "server-only";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { updatePrimaryMenuSettings } from "@compoz/core/domain/site/use-cases/primary-menu/update-primary-menu-settings";
import { readJsonOr400 } from "@compoz/infra/http/read-json";
import type {
  GetPrimaryMenuResponse,
  PatchPrimaryMenuResponse,
} from "@compoz/infra/http/studio/site-settings.types";
import { log, logSpan } from "@compoz/infra/lib/log";
import { getSiteRepository, getSiteStatusCache } from "@compoz/infra/site";
import { adaptUpdatePrimaryMenuIntent } from "@compoz/studio/app/api/_adapters/menus";
import { requireSessionWithTenant } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import { UpdatePrimaryMenuSettingsIntentSchema } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu-intents";

export async function GET(req: Request) {
  const NS = "api.studio.site.primaryMenu.GET" as const;

  return handleRoute(NS, req, async ({ state }) => {
    const { tenantId } = await requireSessionWithTenant();

    return logSpan(NS, { ns: NS, method: "GET", state, tenantId }, async () => {
      const repo = getSiteRepository({ tenantId });
      const settings = await repo.readSettings(state);

      const res: GetPrimaryMenuResponse = { settings: settings.primaryMenu };
      return res;
    });
  });
}

export async function PATCH(req: Request) {
  const NS = "api.studio.site.primaryMenu.PATCH" as const;

  return handleRoute(NS, req, async () => {
    const { tenantId } = await requireSessionWithTenant();

    return logSpan(NS, { ns: NS, method: "PATCH", tenantId }, async () => {
      const lg = log.child({ ns: NS });

      const raw = await readJsonOr400(req);

      lg.debug?.("route.primaryMenu.patch.start", {
        tenantId,
        hasBody: raw != null,
        bodyKeys: raw && typeof raw === "object" ? Object.keys(raw) : [],
        hasKvUrl: Boolean(
          process.env["KV_REST_API_URL"] ??
          process.env["UPSTASH_REDIS_REST_URL"],
        ),
      });

      const dto = parseDTOOrHttp(UpdatePrimaryMenuSettingsIntentSchema, raw, {
        message: EC.VALIDATION_ERROR,
        extras: { where: "api.studio.site.primaryMenu.PATCH.payload" },
      });

      const input = adaptUpdatePrimaryMenuIntent(dto);

      const repo = getSiteRepository({ tenantId });
      const statusCache = getSiteStatusCache({ tenantId });

      const run = updatePrimaryMenuSettings({ repo });
      const { settings } = await run(input);

      lg.debug?.("route.primaryMenu.patch.afterWrite", {
        tenantId,
        primaryMenuKeys: settings?.primaryMenu
          ? Object.keys(settings.primaryMenu)
          : [],
      });

      try {
        lg.debug?.("route.primaryMenu.patch.invalidate.start", { tenantId });
        await statusCache.invalidateStatus();
        lg.debug?.("route.primaryMenu.patch.invalidate.done", { tenantId });
      } catch (e) {
        lg.error?.("route.primaryMenu.patch.invalidate.failed", {
          tenantId,
          err: String(e),
        });
      }

      const res: PatchPrimaryMenuResponse = { settings: settings.primaryMenu };
      return res;
    });
  });
}
