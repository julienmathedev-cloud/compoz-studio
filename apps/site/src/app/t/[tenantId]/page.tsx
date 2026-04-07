/**
 * @file apps/site/src/app/t/[tenantId]/page.tsx
 * @layer site/app
 *
 * @description
 * Fallback multi-tenant : "/t/[tenantId]" -> rend la home published du tenant.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HOME_SLUG } from "@compoz/core/domain/slug/constants";
import { computeSitePager } from "@compoz/ui/lib/app-helpers/site-pager";
import {
  getPublishedHomePageForTenant,
  getPublishedIndexForTenant,
} from "@compoz/site/lib/pages/published-page-loaders";
import { unwrapParams } from "@compoz/site/lib/unwrap-params";
import { getPageH1 } from "@compoz/ui/lib/seo/get-page-h1";
import { toBlockShapeFromDTO } from "@compoz/ui/pages/mappers/block-shape";
import { SitePageRenderer } from "@compoz/ui/renderer/SitePageRenderer";
import { resolveSiteUi } from "@compoz/ui/site/skins/resolveSiteUi";
import type { BlockShape } from "@compoz/validation/pages/blocks/block";

type PageParams = Readonly<{
  params: Promise<Readonly<{ tenantId: string }>>;
}>;

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { tenantId } = await unwrapParams(params);

  const page = await getPublishedHomePageForTenant(tenantId);
  if (!page) return {};

  const blocks: ReadonlyArray<BlockShape> = (page.blocks ?? [])
    .map(toBlockShapeFromDTO)
    .filter((b): b is BlockShape => Boolean(b));

  const h1 = getPageH1(blocks);

  const title =
    (page.seoTitle ?? "").trim() || h1 || (page.name ?? "").trim() || undefined;

  return {
    title,
    alternates: { canonical: `/t/${encodeURIComponent(tenantId)}` },
  };
}

export default async function SiteTenantRootPage({ params }: PageParams) {
  const { tenantId } = await unwrapParams(params);

  const index = await getPublishedIndexForTenant(tenantId);
  if (!index) return notFound();

  const page = await getPublishedHomePageForTenant(tenantId);
  if (!page) return notFound();

  const blocks: ReadonlyArray<BlockShape> = (page.blocks ?? [])
    .map(toBlockShapeFromDTO)
    .filter((b): b is BlockShape => Boolean(b));

  const tenantPrefix = `/t/${encodeURIComponent(tenantId)}`;

  const pager = computeSitePager({
    page,
    index,
    hrefForSlug: (slug) =>
      slug === HOME_SLUG ? tenantPrefix : `${tenantPrefix}/${slug}`,
  });

  return (
    <SitePageRenderer ui={resolveSiteUi()} blocks={blocks} pager={pager} />
  );
}
