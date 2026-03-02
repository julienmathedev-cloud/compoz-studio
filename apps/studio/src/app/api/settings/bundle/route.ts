/**
 * @file apps/studio/src/app/api/settings/settings-bundle/route.ts
 * @layer app/api
 * @description
 * Route Admin — Settings bundle (READ global).
 *
 * GET:
 * - Retourne l'agrégat `SiteSettings` pour un `state` donné (draft|published).
 *
 * @remarks
 * - Read-model canonique pour l’admin (Option B).
 * - Avec KV : le repo stocke déjà `SiteSettings` en un seul document → read direct.
 */

import { NextResponse } from "next/server";

import type { ContentState } from "@compoz/core/constants/common/content-state";

import type { GetSettingsBundleResponse } from "@compoz/infra/http/studio/site-settings.types";
import { KvSiteRepository } from "@compoz/infra/site/kv-site-repository";

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

function parseState(url: URL): ContentState {
  const raw = url.searchParams.get("state");
  return raw === "published" ? "published" : "draft";
}

/* -------------------------------------------------------------------------- */
/*                                    GET                                     */
/* -------------------------------------------------------------------------- */

export async function GET(req: Request) {
  const state = parseState(new URL(req.url));

  const repo = new KvSiteRepository();
  await repo.ensureBase(); // no-op KV, mais garde le contrat
  const settings = await repo.readSettings(state);

  const res: GetSettingsBundleResponse = { settings };
  return NextResponse.json(res);
}
