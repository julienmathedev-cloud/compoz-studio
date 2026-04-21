/**
 * @file apps/studio/src/app/api/settings/legal-menu/route.ts
 * @layer studio/app/api
 * @description
 * Route API Studio pour la lecture et la mise à jour du menu légal.
 *
 * Responsabilités :
 * - GET   : retourne les settings LegalMenu selon le state (draft/published).
 * - PATCH : met à jour les settings LegalMenu (draft-only) via un DTO intent,
 *           adaptation en patch domaine, et exécution du use-case `updateLegalMenuSettings`.
 * - Le repository merge avec les defaults pour assurer la cohérence.
 */

import "server-only";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { updateLegalMenuSettings } from "@compoz/core/domain/site/use-cases/legal-menu/update-legal-menu-settings";
import { readJsonOr400 } from "@compoz/infra/http/read-json";
import type {
  GetLegalMenuResponse,
  PatchLegalMenuResponse,
} from "@compoz/infra/http/studio/site-settings.types";
import { log, logSpan } from "@compoz/infra/lib/log";
import { getSiteRepository, getSiteStatusCache } from "@compoz/infra/site";
import { adaptUpdateLegalMenuIntent } from "@compoz/studio/app/api/_adapters/menus";
import { requireSessionWithTenant } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import { UpdateLegalMenuSettingsIntentSchema } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu-intents";

export async function GET(req: Request) {
  const NS = "api.studio.site.legalMenu.GET" as const;

  return handleRoute(NS, req, async ({ state }) => {
    const { tenantId } = await requireSessionWithTenant();

    return logSpan(NS, { ns: NS, method: "GET", state, tenantId }, async () => {
      const repo = getSiteRepository({ tenantId });
      const settings = await repo.readSettings(state);

      const res: GetLegalMenuResponse = { settings: settings.legalMenu };
      return res;
    });
  });
}

export async function PATCH(req: Request) {
  const NS = "api.studio.site.legalMenu.PATCH" as const;

  return handleRoute(NS, req, async () => {
    const { tenantId } = await requireSessionWithTenant();

    return logSpan(NS, { ns: NS, method: "PATCH", tenantId }, async () => {
      const lg = log.child({ ns: NS });

      const raw = await readJsonOr400(req);

      lg.debug?.("route.legalMenu.patch.start", {
        tenantId,
        hasBody: raw != null,
        bodyKeys: raw && typeof raw === "object" ? Object.keys(raw) : [],
        hasKvUrl: Boolean(
          process.env["KV_REST_API_URL"] ??
          process.env["UPSTASH_REDIS_REST_URL"],
        ),
      });

      const dto = parseDTOOrHttp(UpdateLegalMenuSettingsIntentSchema, raw, {
        message: EC.VALIDATION_ERROR,
        extras: { where: "api.studio.site.legalMenu.PATCH.payload" },
      });

      const input = adaptUpdateLegalMenuIntent(dto);

      const repo = getSiteRepository({ tenantId });
      const statusCache = getSiteStatusCache({ tenantId });

      const run = updateLegalMenuSettings({ repo });
      const { settings } = await run(input);

      lg.debug?.("route.legalMenu.patch.afterWrite", {
        tenantId,
        legalMenuKeys: settings?.legalMenu
          ? Object.keys(settings.legalMenu)
          : [],
      });

      try {
        lg.debug?.("route.legalMenu.patch.invalidate.start", { tenantId });
        await statusCache.invalidateStatus();
        lg.debug?.("route.legalMenu.patch.invalidate.done", { tenantId });
      } catch (e) {
        lg.error?.("route.legalMenu.patch.invalidate.failed", {
          tenantId,
          err: String(e),
        });
      }

      const res: PatchLegalMenuResponse = { settings: settings.legalMenu };
      return res;
    });
  });
}
