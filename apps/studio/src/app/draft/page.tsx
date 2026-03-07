/**
 * @file apps/studio/src/app/draft/page.tsx
 * @layer studio/app
 *
 * @description
 * Route publique "/draft" : rend la page DRAFT "home" (preview stable).
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HOME_SLUG } from "@compoz/core/domain/slug/constants";
import {
  getDraftHomePage,
  getDraftIndex,
} from "@compoz/studio/lib/pages/draft-page-loaders";
import type { BlockShape } from "@compoz/validation/pages/blocks/block";

import { computeSitePager } from "@compoz/ui/lib/app-helpers/site-pager";
import { toSlug } from "@compoz/ui/lib/routing/slug";
import { toBlockShapeFromDTO } from "@compoz/ui/pages/mappers/block-shape";
import { SitePageRenderer } from "@compoz/ui/renderer/SitePageRenderer";
import { resolveSiteUi } from "@compoz/ui/site/skins/resolveSiteUi";
import { STUDIO_PATH } from "@compoz/core/constants/web/paths";

/* -------------------------------------------------------------------------- */
/* Metadata                                                                   */
/* -------------------------------------------------------------------------- */

export async function generateMetadata(): Promise<Metadata> {
  const page = await getDraftHomePage();
  if (!page) return {};
  return { title: page.title };
}

/* -------------------------------------------------------------------------- */
/* Pager                                                                      */
/* -------------------------------------------------------------------------- */

function hrefForDraftSlug(slug: string): string {
  const s = toSlug(slug);
  if (!s || s === HOME_SLUG) return STUDIO_PATH.draft;
  return `/${STUDIO_PATH.draft}/${encodeURIComponent(s)}`;
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default async function DraftRootPage() {
  const index = await getDraftIndex();
  if (!index) notFound();

  const page = await getDraftHomePage();
  if (!page) notFound();

  const blocks: ReadonlyArray<BlockShape> = (page.blocks ?? [])
    .map(toBlockShapeFromDTO)
    .filter((b): b is BlockShape => Boolean(b));

  const pager = computeSitePager({
    page,
    index,
    hrefForSlug: hrefForDraftSlug,
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

DraftRootPage.displayName = "DraftRootPage";
