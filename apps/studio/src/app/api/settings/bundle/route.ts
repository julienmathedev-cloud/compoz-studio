/**
 * @file apps/studio/src/app/api/settings/bundle/route.ts
 * @layer studio/app/api
 *
 * @description
 * Route Studio — Settings bundle du Website actif.
 *
 * @remarks
 * GET:
 * - Retourne l'agrégat `SiteSettings` pour un `state` donné.
 * - Le state lu est `draft` par défaut, ou `published` si demandé.
 * - Read-model canonique pour Studio.
 * - L’implémentation repository est choisie via la factory.
 * - Le repository est scopé par Prisma Website.id.
 */

import "server-only";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import type { GetSettingsBundleResponse } from "@compoz/infra/http/studio/site-settings.types";
import { logSpan } from "@compoz/infra/lib/log";
import { getSiteRepository } from "@compoz/infra/site";
import { requireSessionWithWebsite } from "@compoz/studio/auth/require-session";
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
  const NS = "api.studio.settings.bundle.GET" as const;

  return handleRoute(NS, req, async () => {
    const { websiteId } = await requireSessionWithWebsite();

    const state = parseState(new URL(req.url));

    return logSpan(
      NS,
      { ns: NS, method: "GET", state, websiteId },
      async () => {
        const repo = getSiteRepository({ websiteId });

        await repo.ensureBase();

        const settings = await repo.readSettings(state);

        const res: GetSettingsBundleResponse = { settings };

        return res;
      },
    );
  });
}
