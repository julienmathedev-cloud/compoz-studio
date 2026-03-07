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
import {
  getPublishedHomePageForTenant,
  getPublishedIndexForTenant,
} from "@compoz/site/lib/pages/published-page-loaders";
import { unwrapParams } from "@compoz/site/lib/unwrap-params";
import { toBlockShapeFromDTO } from "@compoz/ui/pages/mappers/block-shape";
import { SitePageRenderer } from "@compoz/ui/renderer/SitePageRenderer";
import { resolveSiteUi } from "@compoz/ui/site/skins/resolveSiteUi";
import type { BlockShape } from "@compoz/validation/pages/blocks/block";

import { computeSitePager } from "@compoz/site/app/_helpers/site-pager";

type PageParams = Readonly<{
  params: Promise<Readonly<{ tenantId: string }>>;
}>;

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { tenantId } = await unwrapParams(params);

  const page = await getPublishedHomePageForTenant(tenantId);
  if (!page) return {};

  return {
    title: (page.title ?? "").trim(),
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

  const pager = computeSitePager({
    page,
    index,
    hrefForSlug: (s) =>
      s === HOME_SLUG
        ? `/t/${encodeURIComponent(tenantId)}`
        : `/t/${encodeURIComponent(tenantId)}/${s}`,
  });

  return (
    <SitePageRenderer
      ui={resolveSiteUi()}
      pageTitle={page.title}
      blocks={blocks}
      pager={pager}
    />
  );
}
