/**
 * @file apps/studio/src/app/draft/page.tsx
 * @layer studio/app
 *
 * @description
 * Route publique "/draft" : rend la page DRAFT "home" (preview stable).
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { STUDIO_PATH } from "@compoz/core/constants/web/paths";
import { HOME_SLUG } from "@compoz/core/domain/slug/constants";
import { DraftPageRenderer } from "@compoz/studio/features/draft/DraftPageRenderer";
import {
  getDraftHomePageByWebsiteId,
  getDraftIndexByWebsiteId,
  getWebsiteId,
} from "@compoz/studio/lib/pages/draft-page-loaders";
import { computeSitePager } from "@compoz/ui/lib/app-helpers/site-pager";
import { toSlug } from "@compoz/ui/lib/routing/slug";
import { getPageH1 } from "@compoz/ui/lib/seo/get-page-h1";
import { toBlockShapeFromDTO } from "@compoz/ui/pages/mappers/block-shape";
import { resolveSiteRuntimeFeatures } from "@compoz/ui/site/skins/resolveSiteRuntimeFeatures";
import type { BlockShape } from "@compoz/validation/pages/blocks/block";

/* -------------------------------------------------------------------------- */
/* Metadata                                                                   */
/* -------------------------------------------------------------------------- */

export async function generateMetadata(): Promise<Metadata> {
  const websiteId = await getWebsiteId();
  const page = await getDraftHomePageByWebsiteId(websiteId);

  if (!page) return {};

  const blocks: ReadonlyArray<BlockShape> = (page.blocks ?? [])
    .map(toBlockShapeFromDTO)
    .filter((b): b is BlockShape => Boolean(b));

  const h1 = getPageH1(blocks);

  const title =
    (page.seoTitle ?? "").trim() || h1 || (page.name ?? "").trim() || undefined;

  return { title };
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
  const websiteId = await getWebsiteId();
  const runtimeFeatures = resolveSiteRuntimeFeatures(websiteId);

  const index = await getDraftIndexByWebsiteId(websiteId);
  if (!index) notFound();

  const page = await getDraftHomePageByWebsiteId(websiteId);
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
    <DraftPageRenderer
      blocks={blocks}
      pager={pager}
      runtimeFeatures={runtimeFeatures}
    />
  );
}

DraftRootPage.displayName = "DraftRootPage";
