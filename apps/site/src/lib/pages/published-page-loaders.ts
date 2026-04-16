/**
 * @file apps/site/src/lib/pages/published-page-loaders.ts
 * @layer site/lib/pages
 *
 * @description
 * Loaders server (Next/React) pour les pages PUBLISHED
 *
 * @remarks
 * - API principale : `...ByTenantId`
 * - Façade host-based conservée
 */

import { headers } from "next/headers";
import { cache } from "react";
import "server-only";

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { resolvePageIdFromIndex } from "@compoz/core/domain/pages/helpers/resolve-page-id-from-index";
import { getPagesRepository } from "@compoz/infra/pages";
import { getSiteRepository } from "@compoz/infra/site";
import { resolveTenantFromHost } from "@compoz/site/lib/tenant/resolve-site-tenant";
import { toSlug } from "@compoz/ui/lib/routing/slug";
import { toTenantId } from "@compoz/ui/lib/tenant-id";

/* -------------------------------------------------------------------------- */
/* Tenant resolution                                                          */
/* -------------------------------------------------------------------------- */

async function resolveTenantIdFromRequest(): Promise<string> {
  const h = await headers();

  const hostRaw = h.get("x-forwarded-host") ?? h.get("host") ?? "";

  const res = resolveTenantFromHost({
    hostRaw,
    defaultTenantId: process.env["COMPOZ_DEFAULT_TENANT_ID"],
    tenantByHostJson: process.env["COMPOZ_TENANT_BY_HOST_JSON"],
  });

  return res.tenantId;
}

export const getTenantId = cache(resolveTenantIdFromRequest);

/* -------------------------------------------------------------------------- */
/* Internal cached loaders                                                    */
/* -------------------------------------------------------------------------- */

const readPublishedSettingsCached = cache(async (tenantId: string) => {
  const repo = getSiteRepository({ tenantId });
  return repo.readSettings(CONTENT_STATE.PUBLISHED);
});

const readPublishedIndexCached = cache(async (tenantId: string) => {
  const repo = getSiteRepository({ tenantId });
  return repo.readIndex(CONTENT_STATE.PUBLISHED);
});

const readPublishedPageByIdCached = cache(
  async (tenantId: string, pageId: string) => {
    const pagesRepo = getPagesRepository({ tenantId });
    return pagesRepo.readById(CONTENT_STATE.PUBLISHED, pageId);
  },
);

/* -------------------------------------------------------------------------- */
/* Core helpers                                                               */
/* -------------------------------------------------------------------------- */

async function getPublishedPageByResolvedSlugForTenant(
  tenantId: string,
  slug: string,
) {
  const index = await readPublishedIndexCached(tenantId);
  if (!index) return null;

  const pageId = resolvePageIdFromIndex({ slug, index });
  if (!pageId) return null;

  return readPublishedPageByIdCached(tenantId, pageId);
}

/* -------------------------------------------------------------------------- */
/* Public API (tenant explicite)                                              */
/* -------------------------------------------------------------------------- */

export async function getPublishedSettingsByTenantId(tenantId: string) {
  const t = toTenantId(tenantId);
  if (!t) return null;

  return readPublishedSettingsCached(t);
}

export async function getPublishedIndexByTenantId(tenantId: string) {
  const t = toTenantId(tenantId);
  if (!t) return null;

  return readPublishedIndexCached(t);
}

export async function getPublishedPageBySlugByTenantId(
  tenantId: string,
  slug: string,
) {
  const t = toTenantId(tenantId);
  if (!t) return null;

  const s = toSlug(slug);
  if (!s || s === "home") return null;

  return getPublishedPageByResolvedSlugForTenant(t, s);
}

export async function getPublishedHomePageByTenantId(tenantId: string) {
  const t = toTenantId(tenantId);
  if (!t) return null;

  return getPublishedPageByResolvedSlugForTenant(t, "home");
}
