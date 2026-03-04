/**
 * @file apps/studio/src/lib/pages/draft-page-loaders.ts
 * @layer draft/lib/pages
 *
 * @description
 * Loaders server (Next/React) pour le rendu Draft (/draft) dans le Studio :
 * - request-dedupe via `cache()`
 * - résolution slug -> pageId via helpers core
 *
 * ✅ Multi-tenant (Studio)
 * - Le tenant est résolu via la session (auth) :
 *   - user normal : defaultTenantId
 *   - admin : cookie "tenant actif" (si défini) sinon defaultTenantId
 *
 * @remarks
 * - Dépend volontairement de React (`cache`) et du runtime server.
 * - Ne doit pas aller dans `@compoz/core`.
 */

import { cache } from "react";
import "server-only";

import {
  CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";
import { resolvePageIdFromIndex } from "@compoz/core/domain/pages/helpers/resolve-page-id-from-index";
import { getPagesRepository } from "@compoz/infra/pages";
import { getSiteRepository } from "@compoz/infra/site";
import { requireSessionWithTenant } from "@compoz/studio/auth/require-session";

/* -------------------------------------------------------------------------- */
/* Tenant resolution (via session)                                            */
/* -------------------------------------------------------------------------- */

async function resolveTenantIdFromSession(): Promise<string> {
  const { tenantId } = await requireSessionWithTenant();
  return tenantId;
}

export const getTenantId = cache(resolveTenantIdFromSession);

/* -------------------------------------------------------------------------- */
/* Internal cached loaders (tenant-aware)                                     */
/* -------------------------------------------------------------------------- */

const readSettingsCached = cache(
  async (tenantId: string, state: ContentState) => {
    const repo = getSiteRepository({ tenantId });
    return repo.readSettings(state);
  },
);

const readIndexCached = cache(async (tenantId: string, state: ContentState) => {
  const repo = getSiteRepository({ tenantId });
  return repo.readIndex(state);
});

const readPageByIdCached = cache(
  async (tenantId: string, state: ContentState, pageId: string) => {
    const pagesRepo = getPagesRepository({ tenantId });
    return pagesRepo.readById(state, pageId);
  },
);

/* -------------------------------------------------------------------------- */
/* DRAFT                                                                       */
/* -------------------------------------------------------------------------- */

export async function getDraftSettings() {
  const tenantId = await getTenantId();
  return readSettingsCached(tenantId, CONTENT_STATE.DRAFT);
}

export async function getDraftIndex() {
  const tenantId = await getTenantId();
  return readIndexCached(tenantId, CONTENT_STATE.DRAFT);
}

export async function getDraftPageBySlug(slug: string) {
  const tenantId = await getTenantId();

  const s = String(slug ?? "").trim();
  if (!s || s === "home") return null;

  const index = await readIndexCached(tenantId, CONTENT_STATE.DRAFT);
  if (!index) return null;

  const pageId = resolvePageIdFromIndex({ slug: s, index });
  if (!pageId) return null;

  return readPageByIdCached(tenantId, CONTENT_STATE.DRAFT, pageId);
}

export async function getDraftHomePage() {
  const tenantId = await getTenantId();

  const index = await readIndexCached(tenantId, CONTENT_STATE.DRAFT);
  if (!index) return null;

  const pageId = resolvePageIdFromIndex({ slug: "home", index });
  if (!pageId) return null;

  return readPageByIdCached(tenantId, CONTENT_STATE.DRAFT, pageId);
}
