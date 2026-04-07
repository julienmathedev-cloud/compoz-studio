/**
 * @file apps/site/src/app/(hosted)/[slug]/page.tsx
 * @layer site/app
 *
 * @description
 * Route "/[slug]" : rendu PUBLISHED-only (SEO stable).
 *
 * @remarks
 * Multi-tenant host-based:
 * - dépend de `headers()` via getPublished* loaders
 * - donc pas compatible avec SSG (`generateStaticParams`) au build
 */

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { SITE_PATH } from "@compoz/core/constants/web/paths";
import { HOME_SLUG } from "@compoz/core/domain/slug/constants";
import { computeSitePager } from "@compoz/ui/lib/app-helpers/site-pager";
import {
  getPublishedIndex,
  getPublishedPageBySlug,
} from "@compoz/site/lib/pages/published-page-loaders";
import { SitePageRuntimeRenderer } from "@compoz/site/lib/pages/SitePageRuntimeRenderer";
import { unwrapParams } from "@compoz/site/lib/unwrap-params";
import { getPageH1 } from "@compoz/ui/lib/seo/get-page-h1";
import { toBlockShapeFromDTO } from "@compoz/ui/pages/mappers/block-shape";
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

  const page = await getPublishedPageBySlug(slug);
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

  const index = await getPublishedIndex();
  if (!index) return notFound();

  const page = await getPublishedPageBySlug(slug);
  if (!page) return notFound();

  const blocks: ReadonlyArray<BlockShape> = (page.blocks ?? [])
    .map(toBlockShapeFromDTO)
    .filter((b): b is BlockShape => Boolean(b));

  const pager = computeSitePager({
    page,
    index,
    hrefForSlug: (s) => (s === HOME_SLUG ? SITE_PATH.home : `/${s}`),
  });

  return <SitePageRuntimeRenderer blocks={blocks} pager={pager} />;
}

SitePage.displayName = "SitePage";
