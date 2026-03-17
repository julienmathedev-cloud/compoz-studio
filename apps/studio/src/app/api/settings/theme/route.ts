/**
 * @file apps/studio/src/app/api/settings/theme/route.ts
 * @layer studio/app/api
 * @description
 * Route API Studio pour la lecture et la mise à jour des réglages Theme du site.
 *
 * Responsabilités :
 * - GET   : retourne les settings Theme selon le state (draft/published).
 * - PATCH : met à jour les settings Theme (draft-only) via un DTO intent,
 *           adaptation en patch domaine, et exécution du use-case `updateThemeSettings`.
 * - Le repository merge avec les defaults pour assurer la cohérence.
 */

import "server-only";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { updateThemeSettings } from "@compoz/core/domain/site/use-cases/theme/update-theme-settings";
import { readJsonOr400 } from "@compoz/infra/http/read-json";
import type {
  GetThemeResponse,
  PatchThemeResponse,
} from "@compoz/infra/http/studio/site-settings.types";
import { log, logSpan } from "@compoz/infra/lib/log";
import { getSiteRepository, getSiteStatusCache } from "@compoz/infra/site";
import { adaptUpdateThemeIntent } from "@compoz/studio/app/api/_adapters/theme";
import { requireSessionWithTenant } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import { UpdateThemeSettingsIntentSchema } from "@compoz/validation/site/settings/theme/theme-intents";

export async function GET(req: Request) {
  const NS = "api.studio.site.theme.GET" as const;

  return handleRoute(NS, req, async ({ state }) => {
    const { tenantId } = await requireSessionWithTenant();

    return logSpan(NS, { ns: NS, method: "GET", state, tenantId }, async () => {
      const repo = getSiteRepository({ tenantId });
      const settings = await repo.readSettings(state);

      const res: GetThemeResponse = { settings: settings.theme };
      return res;
    });
  });
}

export async function PATCH(req: Request) {
  const NS = "api.studio.site.theme.PATCH" as const;

  return handleRoute(NS, req, async () => {
    const { tenantId } = await requireSessionWithTenant();

    return logSpan(NS, { ns: NS, method: "PATCH", tenantId }, async () => {
      const lg = log.child({ ns: NS });

      const raw = await readJsonOr400(req);

      lg.info?.("route.theme.patch.start", {
        tenantId,
        hasBody: raw != null,
        bodyKeys: raw && typeof raw === "object" ? Object.keys(raw) : [],
        hasKvUrl: Boolean(
          process.env["KV_REST_API_URL"] ??
          process.env["UPSTASH_REDIS_REST_URL"],
        ),
      });

      const dto = parseDTOOrHttp(UpdateThemeSettingsIntentSchema, raw, {
        message: EC.VALIDATION_ERROR,
        extras: { where: "api.studio.site.theme.PATCH.payload" },
      });

      const input = adaptUpdateThemeIntent(dto);

      const repo = getSiteRepository({ tenantId });
      const statusCache = getSiteStatusCache({ tenantId });

      const run = updateThemeSettings({ repo });
      const { settings } = await run(input);

      lg.info?.("route.theme.patch.afterWrite", {
        tenantId,
        themeKeys: settings?.theme ? Object.keys(settings.theme) : [],
      });

      try {
        lg.info?.("route.theme.patch.invalidate.start", { tenantId });
        await statusCache.invalidateStatus();
        lg.info?.("route.theme.patch.invalidate.done", { tenantId });
      } catch (e) {
        lg.error?.("route.theme.patch.invalidate.failed", {
          tenantId,
          err: String(e),
        });
      }

      const res: PatchThemeResponse = { settings: settings.theme };
      return res;
    });
  });
}
