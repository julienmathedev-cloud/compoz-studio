/**
 * @file apps/site/src/app/t/[tenantId]/[slug]/page.tsx
 * @layer site/app
 *
 * @description
 * Fallback multi-tenant : "/t/[tenantId]/[slug]" -> rend une page published du tenant.
 */

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { HOME_SLUG } from "@compoz/core/domain/slug/constants";
import {
  getPublishedIndexByTenantId,
  getPublishedPageBySlugByTenantId,
  getPublishedSettingsByTenantId,
} from "@compoz/site/lib/pages/published-page-loaders";
import { unwrapParams } from "@compoz/site/lib/unwrap-params";
import { computeSitePager } from "@compoz/ui/lib/app-helpers/site-pager";
import { getPageH1 } from "@compoz/ui/lib/seo/get-page-h1";
import { toBlockShapeFromDTO } from "@compoz/ui/pages/mappers/block-shape";
import { SitePageRenderer } from "@compoz/ui/renderer/SitePageRenderer";
import { resolveSiteUi } from "@compoz/ui/site/skins/resolveSiteUi";
import type { BlockShape } from "@compoz/validation/pages/blocks/block";

type PageParams = Readonly<{
  params: Promise<
    Readonly<{
      tenantId: string;
      slug: string;
    }>
  >;
}>;

/* -------------------------------------------------------------------------- */
/* Metadata                                                                   */
/* -------------------------------------------------------------------------- */

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { tenantId, slug } = await unwrapParams(params);

  if (slug === HOME_SLUG) {
    return {};
  }

  const page = await getPublishedPageBySlugByTenantId(tenantId, slug);
  if (!page) {
    return {};
  }

  const settings = await getPublishedSettingsByTenantId(tenantId);

  const description =
    (settings?.seo?.defaultDescription ?? "").trim() || undefined;

  const blocks: ReadonlyArray<BlockShape> = (page.blocks ?? [])
    .map(toBlockShapeFromDTO)
    .filter((b): b is BlockShape => Boolean(b));

  const h1 = getPageH1(blocks);

  const title =
    (page.seoTitle ?? "").trim() || h1 || (page.name ?? "").trim() || undefined;

  return {
    title,
    description,
    alternates: {
      canonical: `/t/${encodeURIComponent(tenantId)}/${encodeURIComponent(slug)}`,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default async function SiteTenantPage({ params }: PageParams) {
  const { tenantId, slug } = await unwrapParams(params);

  if (slug === HOME_SLUG) {
    return redirect(`/t/${encodeURIComponent(tenantId)}`);
  }

  const index = await getPublishedIndexByTenantId(tenantId);
  if (!index) {
    return notFound();
  }

  const page = await getPublishedPageBySlugByTenantId(tenantId, slug);
  if (!page) {
    return notFound();
  }

  const blocks: ReadonlyArray<BlockShape> = (page.blocks ?? [])
    .map(toBlockShapeFromDTO)
    .filter((b): b is BlockShape => Boolean(b));

  const tenantPrefix = `/t/${encodeURIComponent(tenantId)}`;

  const pager = computeSitePager({
    page,
    index,
    hrefForSlug: (s) =>
      s === HOME_SLUG ? tenantPrefix : `${tenantPrefix}/${s}`,
  });

  const ui = resolveSiteUi(tenantId);
  const settings = await getPublishedSettingsByTenantId(tenantId);
  const revealPreset = settings?.theme?.revealPreset ?? "fade-up";
  const revealUi = ui.reveal[revealPreset];

  return (
    <SitePageRenderer
      ui={ui}
      blocks={blocks}
      pager={pager}
      revealUi={revealUi}
    />
  );
}

SiteTenantPage.displayName = "SiteTenantPage";
