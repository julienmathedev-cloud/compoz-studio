/**
 * @file apps/studio/src/app/api/settings/bundle/route.ts
 * @layer app/api
 * @description
 * Route Admin — Settings bundle (READ global).
 *
 * GET:
 * - Retourne l'agrégat `SiteSettings` pour un `state` donné (draft|published).
 *
 * @remarks
 * - Read-model canonique pour l’admin (Option B).
 * - L’impl repo est choisie via la factory (`SITE_REPO_IMPL`) et est tenant-aware.
 */

import { logSpan } from "@compoz/infra/lib/log";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import type { GetSettingsBundleResponse } from "@compoz/infra/http/studio/site-settings.types";

import { getSiteRepository } from "@compoz/infra/site";
import { requireSessionWithTenant } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function parseState(url: URL): ContentState {
  const raw = url.searchParams.get("state");
  return raw === "published" ? "published" : "draft";
}

/* -------------------------------------------------------------------------- */
/* GET                                                                        */
/* -------------------------------------------------------------------------- */

export async function GET(req: Request) {
  const NS = "api.admin.settings.bundle.GET" as const;

  return handleRoute(NS, req, async () => {
    const { tenantId } = await requireSessionWithTenant();

    const state = parseState(new URL(req.url));

    return logSpan(NS, { ns: NS, method: "GET", state, tenantId }, async () => {
      const repo = getSiteRepository({ tenantId });
      await repo.ensureBase(); // no-op KV, mais garde le contrat (FS en a besoin)
      const settings = await repo.readSettings(state);

      const res: GetSettingsBundleResponse = { settings };
      return res;
    });
  });
}
