/**
 * @file apps/site/src/app/page.tsx
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
import { computeSitePager } from "@compoz/site/app/_helpers/site-pager";
import {
  getPublishedHomePage,
  getPublishedIndex,
} from "@compoz/site/lib/pages/published-page-loaders";
import { toBlockShapeFromDTO } from "@compoz/ui/pages/mappers/block-shape";
import { SitePageRenderer } from "@compoz/ui/renderer/SitePageRenderer";
import { resolveSiteUi } from "@compoz/ui/site/skins/resolveSiteUi";
import type { BlockShape } from "@compoz/validation/pages/blocks/block";

/* -------------------------------------------------------------------------- */
/* Metadata                                                                   */
/* -------------------------------------------------------------------------- */

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedHomePage();
  if (!page) return {};

  return {
    title: (page.name ?? "").trim(),
    alternates: { canonical: SITE_PATH.home },
  };
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default async function SiteRootPage() {
  const index = await getPublishedIndex();
  if (!index) return notFound();

  const page = await getPublishedHomePage();
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
      ui={resolveSiteUi()}
      pageTitle={page.name}
      blocks={blocks}
      pager={pager}
    />
  );
}

SiteRootPage.displayName = "SiteRootPage";
