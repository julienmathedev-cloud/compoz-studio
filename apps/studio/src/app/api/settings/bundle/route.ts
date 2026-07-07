/**
 * @file apps/studio/src/app/api/settings/bundle/route.ts
 * @layer studio/app/api
 *
 * @description
 * Studio API route for reading the active Website settings bundle.
 *
 * @remarks
 * - Reads `draft` by default, or `published` when explicitly requested.
 * - Acts as the canonical Studio read model for settings.
 * - The repository is scoped by Prisma Website.id.
 */

import "server-only";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import type { GetSettingsBundleResponse } from "@compoz/infra/http/studio/site-settings.types";
import { logSpan } from "@compoz/infra/lib/log";
import { getSiteRepository } from "@compoz/infra/site";
import { requireSessionWithWebsite } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";

function parseState(url: URL): ContentState {
  const raw = url.searchParams.get("state");

  return raw === "published" ? "published" : "draft";
}

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
