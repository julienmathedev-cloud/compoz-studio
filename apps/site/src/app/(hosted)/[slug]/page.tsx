/**
 * @file apps/site/src/app/(hosted)/[slug]/page.tsx
 * @layer site/app
 *
 * @description
 * Route "/[slug]" : rendu PUBLISHED-only (SEO stable).
 *
 * @remarks
 * Multi-tenant host-based:
 * - tenantId résolu explicitement
 * - loaders explicites (pas de dépendance implicite à headers)
 */

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { SITE_PATH } from "@compoz/core/constants/web/paths";
import { HOME_SLUG } from "@compoz/core/domain/slug/constants";
import {
  getPublishedIndexByTenantId,
  getPublishedPageBySlugByTenantId,
  getPublishedSettingsByTenantId,
  getTenantId,
} from "@compoz/site/lib/pages/published-page-loaders";
import { unwrapParams } from "@compoz/site/lib/unwrap-params";
import { computeSitePager } from "@compoz/ui/lib/app-helpers/site-pager";
import { getPageH1 } from "@compoz/ui/lib/seo/get-page-h1";
import { toBlockShapeFromDTO } from "@compoz/ui/pages/mappers/block-shape";
import { SitePageRenderer } from "@compoz/ui/renderer/SitePageRenderer";
import { resolveSiteUi } from "@compoz/ui/site/skins/resolveSiteUi";
import type { BlockShape } from "@compoz/validation/pages/blocks/block";

export const dynamic = "force-dynamic";

type PageParams = Readonly<{
  params: Promise<Readonly<{ slug: string }>>;
}>;

/* -------------------------------------------------------------------------- */
/* Metadata                                                                   */
/* -------------------------------------------------------------------------- */

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { slug } = await unwrapParams(params);

  if (slug === HOME_SLUG) return {};

  const tenantId = await getTenantId();
  const page = await getPublishedPageBySlugByTenantId(tenantId, slug);

  if (!page) return {};

  const blocks: ReadonlyArray<BlockShape> = (page.blocks ?? [])
    .map(toBlockShapeFromDTO)
    .filter((b): b is BlockShape => Boolean(b));

  const h1 = getPageH1(blocks);

  const title =
    (page.seoTitle ?? "").trim() || h1 || (page.name ?? "").trim() || undefined;

  return {
    title,
    alternates: { canonical: `/${encodeURIComponent(slug)}` },
  };
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default async function SitePage({ params }: PageParams) {
  const { slug } = await unwrapParams(params);

  if (slug === HOME_SLUG) return redirect(SITE_PATH.home);

  const tenantId = await getTenantId();
  const ui = resolveSiteUi(tenantId);
  const settings = await getPublishedSettingsByTenantId(tenantId);
  const revealPreset = settings?.theme?.revealPreset ?? "fade-up";
  const revealUi = ui.reveal[revealPreset];

  const index = await getPublishedIndexByTenantId(tenantId);
  if (!index) return notFound();

  const page = await getPublishedPageBySlugByTenantId(tenantId, slug);
  if (!page) return notFound();

  const blocks: ReadonlyArray<BlockShape> = (page.blocks ?? [])
    .map(toBlockShapeFromDTO)
    .filter((b): b is BlockShape => Boolean(b));

  const pager = computeSitePager({
    page,
    index,
    hrefForSlug: (s) => (s === HOME_SLUG ? SITE_PATH.home : `/${s}`),
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

SitePage.displayName = "SitePage";
