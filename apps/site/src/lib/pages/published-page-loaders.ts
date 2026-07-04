/**
 * @file apps/site/src/lib/pages/published-page-loaders.ts
 * @layer site/lib/pages
 *
 * @description
 * Loaders server (Next/React) pour les pages PUBLISHED.
 *
 * @remarks
 * - API principale legacy : `...ByTenantId`
 * - En interne, `tenantId` correspond maintenant au Prisma `websiteId`
 * - Façade host-based conservée
 */

import "server-only";

import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { resolvePageIdFromIndex } from "@compoz/core/domain/pages/helpers/resolve-page-id-from-index";
import { getPagesRepository } from "@compoz/infra/pages";
import { getSiteRepository } from "@compoz/infra/site";
import { resolvePublicWebsiteFromHost } from "@compoz/infra/websites/resolve-public-website";
import { toSlug } from "@compoz/ui/lib/routing/slug";

/* -------------------------------------------------------------------------- */
/* Website resolution                                                         */
/* -------------------------------------------------------------------------- */

function normalizeId(value: unknown): string {
  return String(value ?? "").trim();
}

async function resolveWebsiteIdFromRequest(): Promise<string> {
  const h = await headers();

  const hostRaw = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const website = await resolvePublicWebsiteFromHost({ hostRaw });

  if (!website) {
    notFound();
  }

  return website.websiteId;
}

export const getWebsiteId = cache(resolveWebsiteIdFromRequest);

/**
 * @deprecated Use getWebsiteId instead.
 *
 * Legacy compatibility alias.
 * In the Prisma Website model, this value is now a websiteId.
 */
export const getTenantId = getWebsiteId;

/* -------------------------------------------------------------------------- */
/* Internal cached loaders                                                    */
/* -------------------------------------------------------------------------- */

const readPublishedSettingsCached = cache(async (websiteId: string) => {
  const repo = getSiteRepository({ tenantId: websiteId });
  return repo.readSettings(CONTENT_STATE.PUBLISHED);
});

const readPublishedIndexCached = cache(async (websiteId: string) => {
  const repo = getSiteRepository({ tenantId: websiteId });
  return repo.readIndex(CONTENT_STATE.PUBLISHED);
});

const readPublishedPageByIdCached = cache(
  async (websiteId: string, pageId: string) => {
    const pagesRepo = getPagesRepository({ tenantId: websiteId });
    return pagesRepo.readById(CONTENT_STATE.PUBLISHED, pageId);
  },
);

/* -------------------------------------------------------------------------- */
/* Core helpers                                                               */
/* -------------------------------------------------------------------------- */

async function getPublishedPageByResolvedSlugForWebsite(
  websiteId: string,
  slug: string,
) {
  const index = await readPublishedIndexCached(websiteId);

  if (!index) {
    return null;
  }

  const pageId = resolvePageIdFromIndex({ slug, index });

  if (!pageId) {
    return null;
  }

  return readPublishedPageByIdCached(websiteId, pageId);
}

/* -------------------------------------------------------------------------- */
/* Public API — explicit website/tenant id                                    */
/* -------------------------------------------------------------------------- */

export async function getPublishedSettingsByTenantId(tenantId: string) {
  const websiteId = normalizeId(tenantId);

  if (!websiteId) {
    return null;
  }

  return readPublishedSettingsCached(websiteId);
}

export async function getPublishedIndexByTenantId(tenantId: string) {
  const websiteId = normalizeId(tenantId);

  if (!websiteId) {
    return null;
  }

  return readPublishedIndexCached(websiteId);
}

export async function getPublishedPageBySlugByTenantId(
  tenantId: string,
  slug: string,
) {
  const websiteId = normalizeId(tenantId);

  if (!websiteId) {
    return null;
  }

  const normalizedSlug = toSlug(slug);

  if (!normalizedSlug || normalizedSlug === "home") {
    return null;
  }

  return getPublishedPageByResolvedSlugForWebsite(websiteId, normalizedSlug);
}

export async function getPublishedHomePageByTenantId(tenantId: string) {
  const websiteId = normalizeId(tenantId);

  if (!websiteId) {
    return null;
  }

  return getPublishedPageByResolvedSlugForWebsite(websiteId, "home");
}
