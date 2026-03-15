/**
 * @file apps/site/src/app/[slug]/page.tsx
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
import {
  getPublishedIndex,
  getPublishedPageBySlug,
} from "@compoz/site/lib/pages/published-page-loaders";
import { unwrapParams } from "@compoz/site/lib/unwrap-params";
import { toBlockShapeFromDTO } from "@compoz/ui/pages/mappers/block-shape";
import { SitePageRenderer } from "@compoz/ui/renderer/SitePageRenderer";
import { resolveSiteUi } from "@compoz/ui/site/skins/resolveSiteUi";
import type { BlockShape } from "@compoz/validation/pages/blocks/block";

import { computeSitePager } from "@compoz/site/app/_helpers/site-pager";

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

  // "home" est routée sur / (page dédiée), donc pas de metadata ici
  if (slug === HOME_SLUG) return {};

  const page = await getPublishedPageBySlug(slug);
  if (!page) return {};

  return {
    title: page.name,
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

  return (
    <SitePageRenderer ui={resolveSiteUi()} blocks={blocks} pager={pager} />
  );
}
