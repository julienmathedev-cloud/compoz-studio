/**
 * @file apps/site/src/app/(hosted)/page.tsx
 * @layer site/app
 *
 * @description
 * Route "/" : rend la page publiée "home" (SEO stable).
 *
 * @remarks
 * - PUBLISHED-only pour garder un head/metadata stable.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SITE_PATH } from "@compoz/core/constants/web/paths";
import { HOME_SLUG } from "@compoz/core/domain/slug/constants";
import {
  getPublishedHomePageByTenantId,
  getPublishedIndexByTenantId,
  getPublishedSettingsByTenantId,
  getTenantId,
} from "@compoz/site/lib/pages/published-page-loaders";
import { computeSitePager } from "@compoz/ui/lib/app-helpers/site-pager";
import { getPageH1 } from "@compoz/ui/lib/seo/get-page-h1";
import { toBlockShapeFromDTO } from "@compoz/ui/pages/mappers/block-shape";
import { SitePageRenderer } from "@compoz/ui/renderer/SitePageRenderer";
import { resolveSiteUi } from "@compoz/ui/site/skins/resolveSiteUi";
import type { BlockShape } from "@compoz/validation/pages/blocks/block";

/* -------------------------------------------------------------------------- */
/* Metadata                                                                   */
/* -------------------------------------------------------------------------- */

export async function generateMetadata(): Promise<Metadata> {
  const tenantId = await getTenantId();
  const page = await getPublishedHomePageByTenantId(tenantId);

  if (!page) return {};

  const blocks: ReadonlyArray<BlockShape> = (page.blocks ?? [])
    .map(toBlockShapeFromDTO)
    .filter((b): b is BlockShape => Boolean(b));

  const h1 = getPageH1(blocks);

  const title =
    (page.seoTitle ?? "").trim() || h1 || (page.name ?? "").trim() || undefined;

  return {
    title,
    alternates: { canonical: SITE_PATH.home },
  };
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default async function SiteRootPage() {
  const tenantId = await getTenantId();
  const ui = resolveSiteUi(tenantId);
  const settings = await getPublishedSettingsByTenantId(tenantId);
  const revealPreset = settings?.theme?.revealPreset ?? "fade-up";
  const revealUi = ui.reveal[revealPreset];

  const index = await getPublishedIndexByTenantId(tenantId);
  if (!index) return notFound();

  const page = await getPublishedHomePageByTenantId(tenantId);
  if (!page) return notFound();

  const blocks: ReadonlyArray<BlockShape> = (page.blocks ?? [])
    .map(toBlockShapeFromDTO)
    .filter((b): b is BlockShape => Boolean(b));

  const pager = computeSitePager({
    page,
    index,
    hrefForSlug: (slug) => (slug === HOME_SLUG ? SITE_PATH.home : `/${slug}`),
  });

  return (
    <SitePageRenderer
      ui={ui}
      blocks={blocks}
      pager={pager}
      revealUi={revealUi}
    />
  );
}

SiteRootPage.displayName = "SiteRootPage";
