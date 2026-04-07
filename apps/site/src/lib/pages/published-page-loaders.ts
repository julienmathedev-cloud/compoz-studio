/**
 * @file apps/site/src/lib/pages/published-page-loaders.ts
 * @layer site/lib/pages
 *
 * @description
 * Loaders server (Next/React) pour les pages du site (PUBLISHED-only) basées sur l’index :
 * - request-dedupe via `cache()` (tenant-aware)
 * - résolution slug -> pageId via helpers core
 *
 * ✅ Multi-tenant:
 * - Mode host-based (dev lvh.me + mapping env)
 * - Mode fallback /t/:tenant (force tenant via param)
 *
 * @remarks
 * - Dépend volontairement de React (`cache`) et du runtime server.
 * - Ne doit pas aller dans `@compoz/core`.
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
/* Tenant resolution (host-based)                                             */
/* -------------------------------------------------------------------------- */

async function resolveTenantIdFromRequest(): Promise<string> {
  // ✅ compat: selon ta version Next, headers() peut être sync ou async
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
/* Internal cached loaders (tenant-aware, PUBLISHED-only)                     */
/* -------------------------------------------------------------------------- */

const readPublishedSettingsCached = cache(async (tenantId: string) => {
  console.log("readPublishedSettingsCached avec tenantID", tenantId);
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
/* Public exports (host-based)                                                */
/* -------------------------------------------------------------------------- */

export async function getPublishedSettings() {
  const tenantId = await getTenantId();
  return readPublishedSettingsCached(tenantId);
}

export async function getPublishedIndex() {
  const tenantId = await getTenantId();
  return readPublishedIndexCached(tenantId);
}

export async function getPublishedPageBySlug(slug: string) {
  const tenantId = await getTenantId();
  return getPublishedPageBySlugForTenant(tenantId, slug);
}

export async function getPublishedHomePage() {
  const tenantId = await getTenantId();
  return getPublishedHomePageForTenant(tenantId);
}

/* -------------------------------------------------------------------------- */
/* Public exports (explicit tenant: /t/:tenant)                               */
/* -------------------------------------------------------------------------- */

export async function getPublishedSettingsForTenant(tenantId: string) {
  console.log("getPublishedSettingsForTenant", tenantId);
  const t = toTenantId(tenantId);
  if (!t) return null;

  return readPublishedSettingsCached(t);
}

export async function getPublishedIndexForTenant(tenantId: string) {
  const t = toTenantId(tenantId);
  if (!t) return null;

  return readPublishedIndexCached(t);
}

export async function getPublishedPageBySlugForTenant(
  tenantId: string,
  slug: string,
) {
  const t = toTenantId(tenantId);
  if (!t) return null;

  const s = toSlug(slug);
  if (!s || s === "home") return null;

  const index = await readPublishedIndexCached(t);
  if (!index) return null;

  const pageId = resolvePageIdFromIndex({ slug: s, index });
  if (!pageId) return null;

  return readPublishedPageByIdCached(t, pageId);
}

export async function getPublishedHomePageForTenant(tenantId: string) {
  const t = toTenantId(tenantId);
  if (!t) return null;

  const index = await readPublishedIndexCached(t);
  if (!index) return null;

  const pageId = resolvePageIdFromIndex({ slug: "home", index });
  if (!pageId) return null;

  return readPublishedPageByIdCached(t, pageId);
}
