/**
 * @file apps/studio/src/lib/pages/draft-page-loaders.ts
 * @layer studio/lib/pages
 *
 * @description
 * Loaders server (Next/React) pour le rendu Draft (/draft) dans le Studio :
 * - request-dedupe via `cache()`
 * - résolution slug -> pageId via helpers core
 *
 * ✅ Multi-tenant (Studio)
 * - Le tenant est résolu via la session
 *
 * @remarks
 * - API principale : fonctions `...ByTenantId`
 * - Les fonctions sans suffixe sont des façades
 */

import "server-only";
import { cache } from "react";

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { resolvePageIdFromIndex } from "@compoz/core/domain/pages/helpers/resolve-page-id-from-index";
import { getPagesRepository } from "@compoz/infra/pages";
import { getSiteRepository } from "@compoz/infra/site";
import { requireSessionWithTenant } from "@compoz/studio/auth/require-session";
import { HOME_SLUG } from "@compoz/core/domain/slug/constants";
import { toSlug } from "@compoz/ui/lib/routing/slug";

/* -------------------------------------------------------------------------- */
/* Tenant resolution                                                          */
/* -------------------------------------------------------------------------- */

export const getTenantId = cache(async (): Promise<string> => {
  const { tenantId } = await requireSessionWithTenant();
  return tenantId;
});

/* -------------------------------------------------------------------------- */
/* Internal cached loaders                                                    */
/* -------------------------------------------------------------------------- */

const getSiteRepoCached = cache(async (tenantId: string) => {
  return getSiteRepository({ tenantId });
});

const getPagesRepoCached = cache(async (tenantId: string) => {
  return getPagesRepository({ tenantId });
});

const readDraftSettingsCached = cache(async (tenantId: string) => {
  const repo = await getSiteRepoCached(tenantId);
  return repo.readSettings(CONTENT_STATE.DRAFT);
});

const readDraftIndexCached = cache(async (tenantId: string) => {
  const repo = await getSiteRepoCached(tenantId);
  return repo.readIndex(CONTENT_STATE.DRAFT);
});

const readDraftPageByIdCached = cache(
  async (tenantId: string, pageId: string) => {
    const pagesRepo = await getPagesRepoCached(tenantId);
    return pagesRepo.readById(CONTENT_STATE.DRAFT, pageId);
  },
);

/* -------------------------------------------------------------------------- */
/* Core helpers (tenant explicite)                                            */
/* -------------------------------------------------------------------------- */

async function getDraftPageByResolvedSlugForTenant(
  tenantId: string,
  slug: string,
) {
  const index = await readDraftIndexCached(tenantId);
  if (!index) return null;

  const pageId = resolvePageIdFromIndex({ slug, index });
  if (!pageId) return null;

  return readDraftPageByIdCached(tenantId, pageId);
}

/* -------------------------------------------------------------------------- */
/* Public API (tenant explicite)                                              */
/* -------------------------------------------------------------------------- */

export async function getDraftSettingsByTenantId(tenantId: string) {
  return readDraftSettingsCached(tenantId);
}

export async function getDraftIndexByTenantId(tenantId: string) {
  return readDraftIndexCached(tenantId);
}

export async function getDraftPageBySlugByTenantId(
  tenantId: string,
  slug: string,
) {
  const s = toSlug(slug);
  if (!s || s === HOME_SLUG) return null;

  return getDraftPageByResolvedSlugForTenant(tenantId, s);
}

export async function getDraftHomePageByTenantId(tenantId: string) {
  return getDraftPageByResolvedSlugForTenant(tenantId, HOME_SLUG);
}
